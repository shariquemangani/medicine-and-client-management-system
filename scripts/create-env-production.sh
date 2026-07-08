#!/bin/bash

# Script to create .env.production file for FAM Portal deployment
# This file helps create the .env.production file that will be used during deployment

# Exit on error
set -e

# Function to get input with default value
get_input_with_default() {
  local prompt=$1
  local default=$2
  local input
  
  read -p "$prompt [$default]: " input
  echo ${input:-$default}
}

# Function to get sensitive input (hidden)
get_secret_input() {
  local prompt=$1
  local input
  
  read -s -p "$prompt: " input
  echo ""
  echo $input
}

# Check if .env.production already exists
if [ -f ".env.production" ]; then
  read -p ".env.production already exists. Overwrite? (y/n): " overwrite
  if [[ ! $overwrite =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
  fi
fi

# Create .env.production file
echo "Creating .env.production file for FAM Portal deployment..."

# Get service URL
service_url=$(get_input_with_default "Enter the service URL" "https://fam-portal-unique-id.a.run.app")

# Create the file
cat > .env.production << EOL
# Production environment variables for FAM Portal
# These variables will be automatically included in your Cloud Run deployment

# App URLs
NEXT_PUBLIC_APP_URL=$service_url

EOL

# Prompt for NextAuth configuration
read -p "Do you need NextAuth configuration? (y/n): " need_nextauth
if [[ $need_nextauth =~ ^[Yy]$ ]]; then
  nextauth_secret=$(get_secret_input "Enter NEXTAUTH_SECRET (will be hidden)")
  cat >> .env.production << EOL
# Authentication
NEXTAUTH_URL=$service_url
NEXTAUTH_SECRET=$nextauth_secret

EOL
fi

# Prompt for API configuration
read -p "Do you need API configuration? (y/n): " need_api
if [[ $need_api =~ ^[Yy]$ ]]; then
  api_url=$(get_input_with_default "Enter API URL" "$service_url/api")
  cat >> .env.production << EOL
# API Configuration
NEXT_PUBLIC_API_URL=$api_url

EOL
fi

# Prompt for database configuration
read -p "Do you need database configuration? (y/n): " need_db
if [[ $need_db =~ ^[Yy]$ ]]; then
  database_url=$(get_secret_input "Enter DATABASE_URL (will be hidden)")
  cat >> .env.production << EOL
# Database
DATABASE_URL=$database_url

EOL
fi

# Add any other environment variables
echo "# Additional environment variables" >> .env.production
while true; do
  read -p "Add another environment variable? (y/n): " another
  if [[ ! $another =~ ^[Yy]$ ]]; then
    break
  fi
  
  read -p "Enter variable name (e.g., SMTP_HOST): " var_name
  if [ -z "$var_name" ]; then
    echo "Variable name cannot be empty. Skipping."
    continue
  fi
  
  read -p "Is this a secret/sensitive value? (y/n): " is_secret
  if [[ $is_secret =~ ^[Yy]$ ]]; then
    var_value=$(get_secret_input "Enter value for $var_name (will be hidden)")
  else
    read -p "Enter value for $var_name: " var_value
  fi
  
  echo "$var_name=$var_value" >> .env.production
done

echo "✅ .env.production file created successfully!"
echo "This file will be used automatically during deployment with 'npm run deploy'."
echo ""
echo "📝 Next steps:"
echo "1. Review the .env.production file to ensure all values are correct"
echo "2. Run 'npm run deploy' to deploy your application"
echo ""
echo "🔒 NOTE: .env.production contains sensitive data and should not be committed to version control."
echo "Make sure .env.production is in your .gitignore file."