const fs = require('fs');
const path = require('path');

// Models that need organization field
const modelsToUpdate = [
  'Assignment.js',
  'LiveClass.js',
  'Enrollment.js',
  'StudentGroup.js',
  'Submission.js',
  'Grade.js',
  'Subject.js'
];

const organizationField = `  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },`;

modelsToUpdate.forEach(modelFile => {
  const filePath = path.join(__dirname, '../src/models', modelFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${modelFile} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if organization field already exists
  if (content.includes('organization:')) {
    console.log(`✓ ${modelFile} already has organization field`);
    return;
  }
  
  // Find the schema definition and add organization field
  const schemaPattern = /const \w+Schema = new mongoose\.Schema\({/;
  
  if (schemaPattern.test(content)) {
    content = content.replace(schemaPattern, (match) => {
      return match + '\n' + organizationField;
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${modelFile} with organization field`);
  } else {
    console.log(`⚠️  Could not update ${modelFile} - schema pattern not found`);
  }
});

console.log('\n✅ Organization field added to all models');
console.log('⚠️  Remember to update all queries and controllers to filter by organization!');