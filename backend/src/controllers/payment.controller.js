const Razorpay = require('razorpay');
const crypto = require('crypto');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const Payment = require('../models/Payment');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createOrder = async (req, res) => {
  try {
    const { classId } = req.body;
    
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const amount = classItem.discountPrice || classItem.price;
    
    const options = {
      amount: amount * 100,
      currency: classItem.currency || 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        classId: classItem._id,
        className: classItem.title,
        studentId: req.user.id,
        studentEmail: req.user.email
      }
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      orderId: order.id,
      amount: amount,
      currency: classItem.currency || 'INR',
      status: 'pending',
      student: req.user.id,
      class: classId,
      paymentMethod: 'razorpay'
    });

    res.status(200).json({
      success: true,
      data: {
        order,
        payment,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      classId
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (payment) {
      payment.status = 'completed';
      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.paidAt = Date.now();
      await payment.save();
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      class: classId
    });

    if (enrollment) {
      enrollment.payment.status = 'paid';
      enrollment.payment.amount = payment.amount;
      enrollment.payment.paidAmount = payment.amount;
      enrollment.payment.paymentDate = Date.now();
      enrollment.payment.transactionId = razorpay_payment_id;
      enrollment.payment.paymentMethod = 'razorpay';
      await enrollment.save();
    } else {
      const newEnrollment = await Enrollment.create({
        student: req.user.id,
        class: classId,
        payment: {
          status: 'paid',
          amount: payment.amount,
          paidAmount: payment.amount,
          paymentDate: Date.now(),
          transactionId: razorpay_payment_id,
          paymentMethod: 'razorpay'
        }
      });

      const classItem = await Class.findById(classId);
      classItem.enrolledStudents.push(req.user.id);
      await classItem.save();

      const user = await User.findById(req.user.id);
      user.enrolledClasses.push(newEnrollment._id);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment'
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user.id })
      .populate('class', 'title')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history'
    });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('class', 'title description')
      .populate('student', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.student._id.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details'
    });
  }
};

exports.initiateRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    const refund = await razorpay.payments.refund(payment.paymentId, {
      amount: amount ? amount * 100 : payment.amount * 100,
      notes: {
        reason: reason || 'Customer request'
      }
    });

    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundAmount = amount || payment.amount;
    payment.refundedAt = Date.now();
    payment.refundReason = reason;
    await payment.save();

    const enrollment = await Enrollment.findOne({
      student: payment.student,
      class: payment.class
    });

    if (enrollment) {
      enrollment.payment.status = 'refunded';
      enrollment.status = 'dropped';
      await enrollment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        refund,
        payment
      }
    });
  } catch (error) {
    console.error('Initiate refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund'
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate('student', 'name email')
      .populate('class', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      },
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
};