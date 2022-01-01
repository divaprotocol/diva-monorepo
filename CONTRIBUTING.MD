# Contributing

When contributing to this repository, please first discuss the change you wish
to make via issue, email, or any other method with the maintainers of this repository
before making a change.

Please note we have a [code of conduct](./CODE_OF_CONDUCT.md) which we ask
all contributors to observe 🙏

## How to perform pull requests

Every contribution in this repository is made via pull request, via github. This
provides an opportunity for the team to review and test changes, and the author
an opportunity to document and explain them. If you're new to github and pull
requests, you [might find the github documentation about pull requests useful](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

Succcessful pull requests do both well.

### Creating good pull requests

Think of pull requests not only as requests to change the codebase right now,
but historical documents that can be viewed by others in the future. As an open
source organisation, every one of our pull requests is open to be viewed by others
and as such it is of utmost importance that we aim for clear, concise communication.

- Provide an overview of why the work is taking place including any relevant links
  (to issues for example).
- Remember that anyone could be reading this Pull Request, so the content and tone
  may inform people other than those taking part, now or later.
- Be explicit about when you want feedback, if the Pull Request is work in progress,
  say so. A prefix of “[WIP]” in the title is a simple, common pattern to indicate
  that state.
- When a pull request is ready for review, select one or more reviewers for your PR
  via the github website and/or ask for a review in the relevant communication channels
  for the team (slack or discord).
- Consider creating a screen recording to add to the pull request, explaining your
  changes verbally and visually. A screen recording can go a long way to explain
  things more clearly and set the right tone. You can use [Loom for this purpose](https://www.loom.com/).
- If a pr is aiming to solve a specific issue, include the issue in the branch name,
  for example `192-fix-form-bug`.
- Prefer small PRs when possible. They are much easier to review, test and understand.

### Everyone

- Accept that many programming decisions are opinions. Discuss tradeoffs, which
  you prefer, and reach a resolution quickly.
- Ask good questions; don't make demands. ("What do you think about naming this
  `:user_id`?")
- Good questions avoid judgment and avoid assumptions about the author's
  perspective.
- Ask for clarification. ("I didn't understand. Can you clarify?")
- Avoid selective ownership of code. ("mine", "not mine", "yours")
- Avoid using terms that could be seen as referring to personal traits. ("dumb",
  "stupid"). Assume everyone is intelligent and well-meaning.
- Be explicit. Remember people don't always understand your intentions online.
- Be concise. Fewer words are easier to digest than many. Too much text can
  obfuscate the intention of the author.
- Be humble. ("I'm not sure - let's look it up.")
- Don't use hyperbole. ("always", "never", "endlessly", "nothing")
- Don't use sarcasm.
- Keep it real. If emoji, animated gifs, or humor aren't you, don't force them.
  If they are, use them with aplomb.
- Talk synchronously (e.g. chat, screen-sharing, in person) if there are too
  many "I didn't understand" or "Alternative solution:" comments. Post a
  follow-up comment summarizing the discussion.
- Anyone can merge a pull request that has been reviewed and approved, even if
  they weren't the reviewer themselves.

### Having Your Code Reviewed

- Be grateful for the reviewer's suggestions. ("Good call. I'll make that
  change.")
- Be aware that it can be [challenging to convey emotion and intention online]
- Explain why the code exists. ("It's like that because of these reasons. Would
  it be more clear if I rename this class/file/method/variable?" or if I added
  a comment to explain this alongside the code?)
- Seek to understand the reviewer's perspective.
- Try to respond to every comment.
- Wait to merge the branch until continuous integration (TDDium, Travis CI,
  CircleCI, etc.) tells you the test suite is green in the branch.
- Merge once you feel confident in the code and its impact on the project.
- Final editorial control rests with the pull request author.

[challenging to convey emotion and intention online]: https://thoughtbot.com/blog/empathy-online

### Reviewing Code

Understand why the change is necessary (fixes a bug, improves the user
experience, refactors the existing code). If it is unclear what the intention
of the change is intended or if the change doesn't match the description of the
pull request, ask the author for clarification and an update to the description
and/or title of the pull request.

Then:

- Test the change manually (by running the app on your machine).
- Review and attempt to understand every change in every file in a pull request.
  If something is unclear to you, ask questions to clarify.
- Communicate which ideas you feel strongly about and those you don't.
- Identify ways to simplify the code while still solving the problem.
- If discussions turn too philosophical or academic, move the discussion offline
  to a regular Friday afternoon technique discussion. In the meantime, let the
  author make the final decision on alternative implementations.
- Offer alternative implementations, but assume the author already considered
  them. ("What do you think about using a custom validator here?")
- Seek to understand the author's perspective.
- Remember that you are here to provide feedback, not to be a gatekeeper.
- The author doesn't have to be alone in responding to change requests. Consider
  creating patches (Pull requests to update the main branch of the PR review) to
  speed up getting the pull request into a mergable state. If you do this, ask the
  author to review your patch and let them merge the pull request.
- If the pull request has been tested and you're confident that it can be merged,
  approve it.
