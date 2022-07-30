# then-pipeline

IAM permissions needed to run `cdk bootstrap`:

```buildoutcfg
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "StsAccess",
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole",
                "iam:*Role*"
            ],
            "Resource": [
                "arn:aws:iam::${AWS_ACCOUNT_ID}:role/cdk-*"
            ]
        },
        {
            "Action": [
                "cloudformation:*"
            ],
            "Resource": [
                "arn:aws:cloudformation:${AWS_REGION}:${AWS_ACCOUNT_ID}:stack/CDKToolkit/*"
            ],
            "Effect": "Allow"
        },
        {
            "Sid": "S3Access",
            "Effect": "Allow",
            "Action": [
                "s3:*"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "ECRAccess",
            "Effect": "Allow",
            "Action": [
                "ecr:SetRepositoryPolicy",
                "ecr:GetLifecyclePolicy",
                "ecr:PutImageScanningConfiguration",
                "ecr:DescribeRepositories",
                "ecr:CreateRepository",
                "ecr:DeleteRepository"
            ],
            "Resource": [
                "arn:aws:ecr:${AWS_REGION}:${AWS_ACCOUNT_ID}:repository/cdk-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter*",
                "ssm:PutParameter*",
                "ssm:DeleteParameter*"
            ],
            "Resource": "arn:aws:ssm:${AWS_REGION}:${AWS_ACCOUNT_ID}:parameter/cdk-bootstrap/*"
        }
    ]
}
```

Pipeline for then project.

Before running:

```
cdk deploy
```

Make sure to export these env variables:

```
export REGION=<region>
export ACCOUNT=<account>
```

And also create a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) form github, store it as a plain text secret in AWS SecretsManager and export the secret name:

```
export GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME=<access token>
```

*Not doing so makes the deployment fail with a very unhelpful error message.*

Finally we need to deploy the pipeline manually for the first time:

```
cdk deploy
```