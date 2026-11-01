# Pull requests and owner approval

Contributors may fork this public repository and open pull requests. Changes intended for the app go through a PR to `main`; feature branches remain writable.

The requested `main` protection configuration is recorded in `main-protection.json`:

- Require a pull request and at least one approving review.
- Require code-owner approval; every path, including policy files, is owned by `@kunalkohli`.
- Dismiss approvals when new reviewable commits arrive, and require approval of the latest push by someone other than that pusher.
- Require resolved review conversations. Required CI status checks are deferred until CI is enabled (see below).
- Enforce the rules for administrators too. Block force pushes and deletion.

The JSON file documents configuration; it does not configure GitHub by itself. Repository administrators can inspect actual enforcement in **Settings → Branches → main**. Administrators can still deliberately change repository settings; branch protection cannot prevent that.

## Initial PR / own-account limitation

GitHub reads CODEOWNERS from the **base branch**, so the owner-specific requirement takes effect after this initial PR's CODEOWNERS is merged into `main`. Until then, the required approval count still applies, but the owner file in the PR alone cannot select the required reviewer.

GitHub does not allow PR authors to approve their own PRs. An agent using `kunalkohli`'s credentials creates a PR authored by `kunalkohli`; clicking approval from that same account is not possible. This initial PR is intentionally left open, not merged or bypassed automatically. The owner must decide how to bootstrap it (for example, another authorized reviewer while CODEOWNERS is not yet on the base branch, or a deliberate temporary administrator policy adjustment). Any adjustment should be restored immediately. Future externally authored PRs require `kunalkohli`'s code-owner approval once CODEOWNERS is on `main`.

## CI deferred by owner approval

The owner explicitly approved pushing the app without the CI workflow after GitHub rejected the existing OAuth login for missing `workflow` scope. The workflow is preserved locally, but is **not part of this PR** and no required CI status is configured. Local unit tests, typecheck, production build, and browser checks have passed; these are not GitHub-hosted CI runs.

After fixing credentials, add the saved workflow in a follow-up PR. Once the real check is registered, restore its required status and up-to-date-branch requirement. Keep owner-review protection enabled throughout. The saved workflow uses normal `pull_request` events and read-only contents permissions, not `pull_request_target` or write credentials exposed to contributed code.

No auto-merge or bot bypass is configured by this project.
