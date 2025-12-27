# Project Template — AI Agent Driven Development

This repository is a minimal template for starting new projects
using an AI agent with explicit project memory and phased execution.

## How to use this template

1. Clone this repository.
2. Rename the project if needed.
3. Update SNAPSHOT.md with the project name and initial description.
4. Update BACKLOG.md with project-specific phases and tasks.
5. Open the project in your IDE.
6. Start the agent by asking it to read AGENT.md, SNAPSHOT.md, and BACKLOG.md.

## Core principles

- The AI agent writes code.
- The human defines WHAT and WHY.
- Project state is stored in markdown files.
- The agent updates project memory after each phase.

Chat history is not considered project memory.
Only markdown files in the repository define the project state.

## Project lifecycle

A project typically goes through:
1. Definition
2. Implementation
3. Iterative improvement
4. Completion

The AI agent operates strictly within the current phase.

This template is intentionally minimal.



Creating new proget based on this template:

git clone https://github.com/varvarik/ai-project-template.git my-new-project
cd my-new-project
git remote remove origin
# create new repository on GitHub
git remote add origin https://github.com/varvarik/my-new-project.git
git push -u origin main

