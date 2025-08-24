#!/bin/bash

# MongoDB Database Management Script for Balsampada LMS

DB_NAME="balsampada-lms"

echo "🗄️  Balsampada LMS Database Management"
echo "======================================"

case "$1" in
  "start")
    echo "🔄 Starting MongoDB..."
    brew services start mongodb-community
    echo "✅ MongoDB started"
    ;;
  
  "stop")
    echo "⏹️  Stopping MongoDB..."
    brew services stop mongodb-community
    echo "✅ MongoDB stopped"
    ;;
  
  "status")
    echo "📊 MongoDB Status:"
    brew services list | grep mongodb
    ;;
  
  "connect")
    echo "🔌 Connecting to MongoDB shell..."
    mongosh $DB_NAME
    ;;
  
  "backup")
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    echo "💾 Creating backup in $BACKUP_DIR..."
    mkdir -p $BACKUP_DIR
    mongodump --db $DB_NAME --out $BACKUP_DIR
    echo "✅ Backup created in $BACKUP_DIR"
    ;;
  
  "restore")
    if [ -z "$2" ]; then
      echo "❌ Please provide backup directory path"
      echo "Usage: ./db-management.sh restore <backup_directory>"
      exit 1
    fi
    echo "🔄 Restoring from $2..."
    mongorestore --db $DB_NAME --drop $2/$DB_NAME
    echo "✅ Database restored"
    ;;
  
  "reset")
    echo "⚠️  This will delete ALL data in the database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "🗑️  Dropping database..."
      mongosh $DB_NAME --eval "db.dropDatabase()"
      echo "👤 Creating admin user..."
      cd ../backend && node setup.js
      echo "✅ Database reset complete"
    else
      echo "❌ Operation cancelled"
    fi
    ;;
  
  "seed")
    echo "🌱 Seeding database with sample data..."
    cd ../backend && node scripts/seed-data.js
    echo "✅ Sample data added"
    ;;
  
  "collections")
    echo "📋 Database collections:"
    mongosh $DB_NAME --quiet --eval "db.getCollectionNames().forEach(name => print('  - ' + name))"
    ;;
  
  "users")
    echo "👥 Users in database:"
    mongosh $DB_NAME --quiet --eval "db.users.find({}, {name: 1, email: 1, role: 1}).forEach(u => print('  - ' + u.name + ' (' + u.email + ') - ' + u.role))"
    ;;
  
  *)
    echo "Available commands:"
    echo "  start     - Start MongoDB service"
    echo "  stop      - Stop MongoDB service" 
    echo "  status    - Check MongoDB status"
    echo "  connect   - Connect to MongoDB shell"
    echo "  backup    - Create database backup"
    echo "  restore   - Restore from backup"
    echo "  reset     - Reset database (WARNING: deletes all data)"
    echo "  seed      - Add sample data"
    echo "  collections - List all collections"
    echo "  users     - List all users"
    echo ""
    echo "Usage: ./db-management.sh <command>"
    ;;
esac