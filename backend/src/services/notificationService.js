const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  
  // Create a notification for a single user
  static async createNotification(recipientId, notificationData) {
    try {
      const notification = new Notification({
        recipient: recipientId,
        ...notificationData
      });
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Create notifications for multiple users
  static async createBulkNotifications(recipientIds, notificationData) {
    try {
      const notifications = recipientIds.map(recipientId => ({
        recipient: recipientId,
        ...notificationData
      }));
      
      const createdNotifications = await Notification.insertMany(notifications);
      return createdNotifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      return [];
    }
  }

  // Assignment created notification
  static async notifyAssignmentCreated(assignmentId, classId, teacherId, assignmentTitle) {
    try {
      // Get all students enrolled in the class
      const Class = require('../models/Class');
      const classData = await Class.findById(classId).populate('enrolledStudents');
      
      if (!classData || !classData.enrolledStudents.length) {
        return;
      }

      const studentIds = classData.enrolledStudents.map(student => student._id);
      
      const notificationData = {
        sender: teacherId,
        type: 'assignment_created',
        title: 'New Assignment Available',
        message: `A new assignment "${assignmentTitle}" has been posted for your class.`,
        data: {
          assignmentId,
          classId
        },
        priority: 'medium'
      };

      await this.createBulkNotifications(studentIds, notificationData);
    } catch (error) {
      console.error('Error creating assignment notifications:', error);
    }
  }

  // Assignment submitted notification
  static async notifyAssignmentSubmitted(assignmentId, studentId, teacherId, assignmentTitle, studentName) {
    const notificationData = {
      sender: studentId,
      type: 'assignment_submitted',
      title: 'Assignment Submitted',
      message: `${studentName} has submitted the assignment "${assignmentTitle}".`,
      data: {
        assignmentId
      },
      priority: 'medium'
    };

    await this.createNotification(teacherId, notificationData);
  }

  // Assignment graded notification
  static async notifyAssignmentGraded(assignmentId, studentId, teacherId, assignmentTitle, grade) {
    const notificationData = {
      sender: teacherId,
      type: 'assignment_graded',
      title: 'Assignment Graded',
      message: `Your assignment "${assignmentTitle}" has been graded. Score: ${grade}`,
      data: {
        assignmentId
      },
      priority: 'high'
    };

    await this.createNotification(studentId, notificationData);
  }

  // Class enrollment notification
  static async notifyClassEnrollment(classId, studentId, teacherId, className, studentName) {
    const notificationData = {
      sender: studentId,
      type: 'class_enrolled',
      title: 'New Student Enrollment',
      message: `${studentName} has enrolled in your class "${className}".`,
      data: {
        classId
      },
      priority: 'low'
    };

    await this.createNotification(teacherId, notificationData);
  }

  // Study material uploaded notification
  static async notifyMaterialUploaded(materialId, classId, teacherId, materialTitle) {
    try {
      const Class = require('../models/Class');
      const classData = await Class.findById(classId).populate('enrolledStudents');
      
      if (!classData || !classData.enrolledStudents.length) {
        return;
      }

      const studentIds = classData.enrolledStudents.map(student => student._id);
      
      const notificationData = {
        sender: teacherId,
        type: 'material_uploaded',
        title: 'New Study Material',
        message: `New study material "${materialTitle}" has been uploaded to your class.`,
        data: {
          materialId,
          classId
        },
        priority: 'low'
      };

      await this.createBulkNotifications(studentIds, notificationData);
    } catch (error) {
      console.error('Error creating material notifications:', error);
    }
  }

  // Class starting notification
  static async notifyClassStarting(classId, teacherId, className, startTime) {
    try {
      const Class = require('../models/Class');
      const classData = await Class.findById(classId).populate('enrolledStudents');
      
      if (!classData || !classData.enrolledStudents.length) {
        return;
      }

      const studentIds = classData.enrolledStudents.map(student => student._id);
      
      const notificationData = {
        sender: teacherId,
        type: 'class_starting',
        title: 'Class Starting Soon',
        message: `Your class "${className}" is starting at ${new Date(startTime).toLocaleTimeString()}.`,
        data: {
          classId
        },
        priority: 'high'
      };

      await this.createBulkNotifications(studentIds, notificationData);
    } catch (error) {
      console.error('Error creating class starting notifications:', error);
    }
  }

  // Payment received notification
  static async notifyPaymentReceived(paymentId, studentId, teacherId, className, amount) {
    const notificationData = {
      sender: studentId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of ${amount} received for class "${className}".`,
      data: {
        paymentId
      },
      priority: 'medium'
    };

    await this.createNotification(teacherId, notificationData);
  }

  // General notification
  static async sendGeneralNotification(recipientIds, title, message, senderId = null) {
    const notificationData = {
      sender: senderId,
      type: 'general',
      title,
      message,
      priority: 'medium'
    };

    if (Array.isArray(recipientIds)) {
      await this.createBulkNotifications(recipientIds, notificationData);
    } else {
      await this.createNotification(recipientIds, notificationData);
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
      );
      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }

  // Delete old notifications (cleanup)
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true
      });
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
}

module.exports = NotificationService;