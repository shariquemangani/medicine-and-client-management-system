#!/bin/bash

# Script to create .env.development file for FAM Portal DEV deployment
# This file helps create the .env.development file that will be used during development deployment

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

# Check if .env.development already exists
if [ -f ".env.development" ]; then
  read -p ".env.development already exists. Overwrite? (y/n): " overwrite
  if [[ ! $overwrite =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
  fi
fi

# Create .env.development file
echo "Creating .env.development file for FAM Portal DEV deployment..."

# Get service URL - predicting the dev URL format
service_url=$(get_input_with_default "Enter the DEV service URL" "https://fam-portal-dev-unique-id.a.run.app")

# Create the file
cat > .env.development << EOL
# Development environment variables for FAM Portal
# These variables will be automatically included in your Cloud Run DEV deployment

# App URLs
NEXT_PUBLIC_APP_URL=$service_url

EOL

# Prompt for NextAuth configuration
read -p "Do you need NextAuth configuration for DEV? (y/n): " need_nextauth
if [[ $need_nextauth =~ ^[Yy]$ ]]; then
  nextauth_secret=$(get_input_with_default "Enter NEXTAUTH_SECRET for DEV" "dev-secret-key-change-in-production")
  cat >> .env.development << EOL
# Authentication (DEV)
NEXTAUTH_URL=$service_url
NEXTAUTH_SECRET=$nextauth_secret

EOL
fi

# Prompt for API configuration
read -p "Do you need API configuration for DEV? (y/n): " need_api
if [[ $need_api =~ ^[Yy]$ ]]; then
  api_url=$(get_input_with_default "Enter DEV API URL" "$service_url/api")
  cat >> .env.development << EOL
# API Configuration (DEV)
NEXT_PUBLIC_API_URL=$api_url

EOL
fi

# Prompt for database configuration
read -p "Do you need database configuration for DEV? (y/n): " need_db
if [[ $need_db =~ ^[Yy]$ ]]; then
  database_url=$(get_input_with_default "Enter DEV DATABASE_URL" "your-dev-database-url")
  cat >> .env.development << EOL
# Database (DEV)
DATABASE_URL=$database_url

EOL
fi

# Add any other environment variables
echo "# Additional DEV environment variables" >> .env.development
while true; do
  read -p "Add another DEV environment variable? (y/n): " another
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
    var_value=$(get_secret_input "Enter DEV value for $var_name (will be hidden)")
  else
    read -p "Enter DEV value for $var_name: " var_value
  fi
  
  echo "$var_name=$var_value" >> .env.development
done

echo "✅ .env.development file created successfully!"
echo "This file will be used automatically during DEV deployment with 'npm run deploy:dev'."
echo ""
echo "📝 Next steps:"
echo "1. Review the .env.development file to ensure all values are correct"
echo "2. Run 'npm run deploy:dev' to deploy your development application"
echo ""
echo "🔒 NOTE: .env.development contains development configuration and should not be committed to version control."
echo "Make sure .env.development is in your .gitignore file."