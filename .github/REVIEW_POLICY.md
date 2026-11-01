# Pull requests and owner approval

Contributors may fork this public repository and open pull requests. Changes intended for the app go through a PR to `main`; feature branches remain writable.

The requested `main` protection configuration is recorded in `main-protection.json`:

- Require a pull request and at least one approving review.
- Require code-owner approval; every path, including policy files, is owned by `@kunalkohli`.
- Dismiss approvals when new reviewable commits arrive. The separate "someone other than the last pusher" requirement is disabled.
- Require resolved review conversations. Required CI status checks are deferred until CI is enabled (see below).
- Keep protection for non-admin contributors, including blocked force pushes and deletion. Administrator enforcement is disabled so the repository owner can bypass review for their own PRs.

The JSON file documents configuration; it does not configure GitHub by itself. Repository administrators can inspect actual enforcement in **Settings → Branches → main**. Administrators can still deliberately change repository settings; branch protection cannot prevent that.

## Owner-authored PRs

The owner explicitly requested that their own PRs not require review. GitHub does not provide an author-conditional review exemption here, and its API rejects individual-user bypass allowances on this personal repository. The available solution is the repository owner/admin bypass (`enforce_admins: false`). This is broader than an own-PR-only exception: the owner can also bypass review on other PRs and other applicable protections. Other contributors receive no bypass permission.

On an owner-authored PR, GitHub may still display "Review required" because the general rule remains enabled. As the owner, select **Merge without waiting for requirements to be met (bypass branch protections)** if GitHub presents that option, then merge normally. This is not self-approval; GitHub does not allow authors to approve their own PRs. No PR is merged automatically by the agent.

## Initial CODEOWNERS bootstrap

GitHub reads CODEOWNERS from the **base branch**, so the owner-specific requirement takes effect after this initial PR's CODEOWNERS is merged into `main`. Until then, the required approval count still applies, but the owner file in the PR alone cannot select the required reviewer.

This initial PR is intentionally left open. The owner may merge it using the configured admin bypass. Future externally authored PRs require `kunalkohli`'s code-owner approval once CODEOWNERS is on `main`, unless the owner deliberately uses their broader admin bypass. Do not disable required reviews for contributors or silently merge on the owner's behalf.

## CI deferred by owner approval

The owner explicitly approved pushing the app without the CI workflow after GitHub rejected the existing OAuth login for missing `workflow` scope. The workflow is preserved locally, but is **not part of this PR** and no required CI status is configured. Local unit tests, typecheck, production build, and browser checks have passed; these are not GitHub-hosted CI runs.

After fixing credentials, add the saved workflow in a follow-up PR. Once the real check is registered, restore its required status and up-to-date-branch requirement. Keep owner-review protection enabled throughout. The saved workflow uses normal `pull_request` events and read-only contents permissions, not `pull_request_target` or write credentials exposed to contributed code.

No auto-merge or bot bypass is configured by this project. The owner/admin bypass is enabled only as described above.
