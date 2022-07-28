# then-pipeline
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