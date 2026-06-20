# Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM deploy user key |
| `AWS_SECRET_ACCESS_KEY` | IAM deploy user secret |
| `AWS_REGION` | e.g. `eu-west-1` |
| `DB_PASSWORD` | RDS database password |
| `JWT_KEY` | JWT signing secret (min 32 chars) |
| `RESEND_API_KEY` | Resend email API key |
| `LAMBDA_FUNCTION_NAME` | From `terraform output lambda_function_name` |
| `DATABASE_CONNECTION_STRING` | Optional — enables CI migration step |
