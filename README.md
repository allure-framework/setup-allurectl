# setup-allurectl

This action intended to help you with the setup of `allurectl` in your workflow.

## What is allurectl

`allurectl` is a CLI wrapper of [Allure Testops](https://qameta.io) API performing the operations for upload of the test results, launches and projects management on Allure Testops side.

## Prerequisites

1. You need to have Allure Testops instance with [trial](https://qameta.io/free-trial) or commercial licence up and running.
2. You need to create API token which will be used for the authentication. To create tokens, [proceed to your Allure Testops profile.](https://docs.qameta.io/allure-testops/integrations/com/allure-token/)
3. You need to have a project created in Allure Testops to which you are going to upload the test results.

## Usage

To upload the test results to Allure Testops please use following instructions in your workflow.

### Use the action into your workflow and setup the action

```yaml
      - uses: allure-framework/setup-allurectl@v1
        with: 
          allure-endpoint: https://allure.testops.url
          allure-token: ${{ secrets.ALLURE_TOKEN }}
          allure-project-id: <PROJECT_ID>
```

1. `allure.testops.url` is the URL of your Allure Testops instance without additional context paths, e.g. `https://allure.testops.url`
2. `${{ secret.ALLURE_TOKEN }}` is the personal API token created in your profile of Allure Testops. You need to save [API Token](https://docs.qameta.io/allure-testops/integrations/com/allure-token/) under `/settings/secrets/actions` as a new secret with name `ALLURE_TOKEN` in your GitHub repository and use it as the reference to the created secret – `${{ secret.ALLURE_TOKEN }}`. Having this parameter saved as plain text in the workflow is a bad idea that will compromise API token and could lead to the data loss. Please avoid this.
3. <PROJECT_ID> is the ID of a project to which you are sending the test results.

### Use allurectl to upload the test results to Allure Testops

```yaml
      - run: allurectl watch -- <test execution command>
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
          allure-endpoint: https://demo.Testops.cloud
          allure-token: ${{ secret.ALLURE_TOKEN }}
          allure-project-id: 1
      - run: allurectl watch -- ./gradlew clean test
        env: 
          ALLURE_RESULTS: build/allure-results
  ```

### Managing the version of allurectl

If there a need to use a specific version of allurectl (e.g. if you need to test a pre-release version), you can use additional configuration parameter `allurectl-version`.

```yaml
      - uses: allure-framework/setup-allurectl@v1
        with: 
          allure-endpoint: https://ALURE_Testops_URL
          allure-token: ${{ secrets.ALLURE_TOKEN }}
          allure-project-id: <PRJ_ID>
          allurectl-version: 2.15.4
```

The information on releases can be found in the releases section of [allurectl repository.](https://github.com/allure-framework/allurectl/releases)
