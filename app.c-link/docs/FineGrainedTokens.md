# Guide for Creating Fine-Grained Personal Access Tokens in GitHub (Beta)

This document provides a step-by-step guide for creating fine-grained personal access tokens (PAT) in GitHub with read access to code and metadata, utilizing the beta feature for more granular control.

## Steps to Create a Token

### 1. Log in to Your GitHub Account
- Navigate to [GitHub](https://github.com) and log in with your account credentials.

### 2. Access the Token Settings
- Click on your profile picture in the top right corner.
- Select **Settings** from the dropdown menu.
- In the settings page, select **Developer settings** from the left sidebar.
- Click on **Personal access tokens**.

### 3. Generate a New Token
- Click on the **Generate new token** button.
- Enter a descriptive name for your token in the **Note** field.
- Select Expiration. Maximun is 1 year, probably what you want to select

### 4. Configure Access and Permissions
Set especific permissions for the token.
  - Could be all repositories or select the relevant ones.
  - Look for scopes like `read:code`, `read:metadata`, or similar to grant read access to code and metadata ONLY!
  - Avoid granting write permissions or full repository access unless necessary.

### 5. Review and Generate the Token
- After selecting the required scopes, review them for accuracy.
- Click on **Generate token** at the bottom of the page.

### 6. Copy and Secure Your Token
- Copy the token displayed and store it securely.
- Remember, GitHub will not display the token again.

## Best Practices and Security
- Regularly review and rotate your tokens.
- Follow GitHub's security best practices, especially since the Fine-Grained Personal Access Tokens feature is in beta and subject to changes.
- Put a calendar remindar at least couple of weeks before expiring so we remember to change it
