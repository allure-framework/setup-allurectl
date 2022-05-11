# setup-allurectl

This action intended to help you with the setup of `allurectl` in your workflow.

## What is allurectl

`allurectl` is a CLI wrapper of [Allure TestOps](https://qameta.io) API performing the operations for upload of the test results, launches and projects management on Allure TestOps side.

## Prerequisites

1. You need to have Allure TestOps instance with [trial](https://qameta.io/free-trial) or commercial licence up and running.
2. You need to create API token which will be used for the authentication. To create tokens, proceed to your Allure TestOps profile.
3. You need to have a project created in Allure TestOps to which you are going to upload the test results.

## Usage

To upload the test results to Allure TestOps please use following instructions in your workflow.

### Use the action into your workflow and setup the action

```yaml
      - uses: allure-framework/setup-allurectl@v1
        with: 
          allure-endpoint: https://ALURE_TESTOPS_URL
          allure-token: ${{ secret.ALLURE_TOKEN }}
          allure-project-id: <PRJ_ID>
```

where

1. `ALURE_TESTOPS_URL` is the URL of your Allure TestOps instance without additional paths, e.g. `https://allure.testops`
2. `${{ secret.ALLURE_TOKEN }}` is the personal API token created in your profile of Allure TestOps. You need to save API token under `/settings/secrets/actions` as a secret `ALLURE_TOKEN` in your GitHub repository and use it as the reference to the created secret – `${{ secret.ALLURE_TOKEN }}`. Having this parameter saved as plain text in the  workflow is a bad-bad-bad idea.
3. <PRJ_ID> is the ID of a project to which you are sending the test results.

### Use allurectl to upload the test results to Allure TestOps

```yaml
      - run: allurect watch -- <test execution command>
        env: 
          ALLURE_RESULTS: <path/to/test-results>
```

where

1. `<test execution command>` is the command for triggering the tests execution, e.g. `./gradlew clean test`
2. `<path/to/test-results>` is the path to the directory with test results files, e.g. `build/allure-results`

### Complete example

```yaml
  on: [push]

  jobs:
    tests:
      runs-on: ubuntu-latest
      steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '17'
          cache: 'gradle'
      - uses: allure-framework/setup-allurectl@v1
        with: 
          allure-endpoint: https://where.is.allure
          allure-token: ${{ secret.ALLURE_TOKEN }}
          allure-project-id: 1
      - run: allurect watch -- ./gradlew clean test
        env: 
          ALLURE_RESULTS: build/allure-results
  ```
