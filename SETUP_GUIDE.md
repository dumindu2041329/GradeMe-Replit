# GradeMe - Secure Setup Guide

## Initial User Setup

For security reasons, GradeMe no longer includes hardcoded default credentials. You must configure initial users using environment variables.

### Creating an Admin User

To create an initial admin user, set these environment variables before starting the application:

```bash
INITIAL_ADMIN_EMAIL="your-admin@email.com"
INITIAL_ADMIN_PASSWORD="your-secure-password-here"
INITIAL_ADMIN_NAME="Administrator Name"  # Optional, defaults to "Administrator"
```

### Creating a Student User (Optional)

To create an initial student user for testing:

```bash
INITIAL_STUDENT_EMAIL="student@email.com"
INITIAL_STUDENT_PASSWORD="secure-student-password"
INITIAL_STUDENT_NAME="John Doe"  # Optional
INITIAL_STUDENT_CLASS="12th Grade"  # Optional
INITIAL_STUDENT_PHONE="123-456-7890"  # Optional
INITIAL_STUDENT_ADDRESS="123 Main St"  # Optional
INITIAL_STUDENT_GUARDIAN="Jane Doe"  # Optional
INITIAL_STUDENT_GUARDIAN_PHONE="123-456-7891"  # Optional
```

### Security Best Practices

1. **Strong Passwords**: Use complex, unique passwords for all accounts
2. **Environment Variables**: Never commit credentials to version control
3. **Change Defaults**: Always change any initial passwords after first login
4. **Regular Updates**: Rotate passwords regularly
5. **Access Control**: Limit admin account creation to authorized personnel

### Setting Environment Variables in Replit

1. Click on the "Secrets" icon in the sidebar (padlock icon)
2. Add each environment variable as a new secret
3. Restart the application to apply the changes

### Important Notes

- Initial users are only created on first run when no users exist
- If no admin credentials are configured and no admin exists, you'll see a warning
- Once created, these credentials won't be overwritten on subsequent runs
- For production deployments, use a secure password manager and rotation policy