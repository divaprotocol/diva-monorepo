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
requests, you [might find the github documentation about pull requests useful](
  https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

Succcessful pull requests do both well.

### Creating good pull requests

Think of pull requests not only as requests to change the codebase right now,
but historical documents that can be viewed by others in the future. As an open
source organisation, every one of our pull requests is open to be viewed by others
and as such it is of utmost importance that we aim for clear, concise communication.

- Consider providing an overview of why the work is taking place (with any relevant
  links); don’t assume familiarity with the history.
- Remember that anyone could be reading this Pull Request, so the content and tone
  may inform people other than those taking part, now or later.
- Be explicit about when you want feedback, if the Pull Request is work in progress,
  say so. A prefix of “[WIP]” in the title is a simple, common pattern to indicate
  that state.
- When a 

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
- Be humble. ("I'm not sure - let's look it up.")
- Don't use hyperbole. ("always", "never", "endlessly", "nothing")
- Don't use sarcasm.
- Keep it real. If emoji, animated gifs, or humor aren't you, don't force them.
  If they are, use them with aplomb.
- Talk synchronously (e.g. chat, screen-sharing, in person) if there are too
  many "I didn't understand" or "Alternative solution:" comments. Post a
  follow-up comment summarizing the discussion.
- A screen recording can go a long way to explain things more clearly and set
  the right tone. We like using [loom for this purpose](https://www.loom.com/).

### Having Your Code Reviewed

- Be grateful for the reviewer's suggestions. ("Good call. I'll make that
  change.")
- Be aware that it can be [challenging to convey emotion and intention online]
- Explain why the code exists. ("It's like that because of these reasons. Would
  it be more clear if I rename this class/file/method/variable?")
- Extract some changes and refactoring into future tickets/stories.
- Link to the code review from the ticket/story. ("Ready for review:
  https://github.com/organization/project/pull/1")
- Push commits based on earlier rounds of feedback as isolated commits to the
  branch. Do not squash until the branch is ready to merge. Reviewers should be
  able to read individual updates based on their earlier feedback.
- Seek to understand the reviewer's perspective.
- Try to respond to every comment.
- Wait to merge the branch until continuous integration (TDDium, Travis CI,
  CircleCI, etc.) tells you the test suite is green in the branch.
- Merge once you feel confident in the code and its impact on the project.
- Final editorial control rests with the pull request author.

[challenging to convey emotion and intention online]: https://thoughtbot.com/blog/empathy-online

### Reviewing Code

Understand why the change is necessary (fixes a bug, improves the user
experience, refactors the existing code). If it is unclear what the change is
intended to accomplish, ask the author for clarification and an update to the
pr description.

Then:

- Communicate which ideas you feel strongly about and those you don't.
- Identify ways to simplify the code while still solving the problem.
- If discussions turn too philosophical or academic, move the discussion offline
  to a regular Friday afternoon technique discussion. In the meantime, let the
  author make the final decision on alternative implementations.
- Offer alternative implementations, but assume the author already considered
  them. ("What do you think about using a custom validator here?")
- Seek to understand the author's perspective.
- Sign off on the pull request with a 👍 or "Ready to merge" comment.
- Remember that you are here to provide feedback, not to be a gatekeeper.
