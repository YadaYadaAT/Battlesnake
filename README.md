# Battlesnake CI/CD Automation

[![Run Tests](https://github.com/YadaYadaAT/Battlesnake/actions/workflows/test.yml/badge.svg)](https://github.com/YadaYadaAT/Battlesnake/actions/workflows/test.yml)
[![Lint Code](https://github.com/YadaYadaAT/Battlesnake/actions/workflows/lint.yml/badge.svg)](https://github.com/YadaYadaAT/Battlesnake/actions/workflows/lint.yml)

Welcome to the **Battlesnake CI/CD Automation** repository! This project is part of our university coursework where we combine competitive game development with hands-on DevOps experience. Here, we build a Battlesnake bot and integrate modern development practices including continuous integration, continuous delivery, and agile issue tracking.

## Contributors:
- Argyro Ververaki (vertimnu-s) && 'YadaYadaAt' (privately owned, org GitHub profile used for further control)
- Sofia Kakou (SofiaKakou)
- Sofia Loukisa (SofiaLoukisa)
- Anastasia Kouridaki (akouridaki)

---

## Table of Contents

- [About the Project](#about-the-project)
- [Agility](#agility)  
- [Technologies](#technologies)  
- [Getting Started](#getting-started)  
- [Running the Game](#running-the-game)  
- [Project Structure](#project-structure)  
- [Testing](#testing)  
- [Acknowledgments](#acknowledgments)  

---

## About the Project


This project demonstrates how to develop a Battlesnake bot while implementing a full CI/CD pipeline using **GitHub Actions**. It also incorporates **YouTrack** for agile issue and sprint management, helping us maintain a structured and efficient workflow.

To help us automate and control our work, we used Conventional Commits and Conventional Changelog, along with Husky to enforce adherence to Conventional Commits standards and rules. Developers are unable to commit changes unless they adhere to the conventional commit rules.

We also use Standard Version to automate versioning and changelog generation. 

JSDocs is used for documentation.

ESLint and Prettier are used to lint codebase and ensure consistency.

Jest is used for testing and coverage checks.

Our 'main' and 'develop' branches are protected by GitHub rulesets, to ensure safety. 

Goals and learning outcomes include:

- Automating testing and linting on each commit and pull request with GitHub Actions.  
- Implementing continuous delivery to deploy the Battlesnake server seamlessly.  
- Managing development sprints and issues with YouTrack.  
- Writing clean, maintainable JavaScript code for game logic following Battlesnake API conventions.  
- Applying Agile principles in a real-world software project environment.  

---

## Agility

Before beginning our work on the project, we broke down all the possible issues we would have to tackle, and created a Gantt chart on YouTrack:

![Gantt](./images/gantt.png)

We ended up not using the Gantt chart itself, but it was a good introduction to the project.

In order to keep track of everyone's work, we created a YouTrack Agile Board and split the four iterations into four sprints:

![Sprint 1](./images/spr1.png)
![Sprint 2](./images/spr2.png)
![Sprint 3](./images/spr3.png)
![Sprint 4](./images/spr4after.png)

Each one of us got assigned tasks, which were split into Epics, Tasks, Subtasks, or Organizational tasks, for consistency. 

For the final part of the process, labeled 'extras', we used the backlog...

![Backlog](./images/spr4b4.png)

...and every time we had some extra time on our hands, we pulled issues out of the backlog and worked on them during our sprints!

We ensured that the issues were tracked automatically by YouTrack by using a 'refs' section at the end of each of our commits. Thus, under the description of each issue, one can see all the commits related to it that have been pushed to GitHub:

![Issues](./images/issue-track.png)

---

## Technologies

- **Battlesnake Game API** — The core API to interact with the Battlesnake game engine.  
- **Node.js** — Backend runtime environment for running the Battlesnake server.  
- **JavaScript** — Programming language used to develop game logic and utility functions.  
- **GitHub Actions** — CI/CD automation for linting, testing, and deployment.  
- **YouTrack** — Agile project management for issue tracking and sprint planning.  
- **ESLint** — Code quality and style enforcement tool.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v14 or later  
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. Clone the repo:  
   ```bash
   git clone https://github.com/YadaYadaAT/Battlesnake.git
   cd Battlesnake
   ```
2. Install dependencies:
   ```npm install```
3. Configure environment variables:
   Create a .env file in the root directory to specify any environment-specific variables your setup requires (e.g., port number).


---

## Running the Game

To launch the Battlesnake server locally:

```bash
npm run dev --snakes <number-of-snakes>
```

Replace `<number-of-snakes>` with an integer up to 4 to specify how many snake instances the server should simulate.
If you wish to add more snakes, you can do so by manually adding them in the 'info' function in handlers.js. However, we only recommend you do this for larger grid sizes.

---

## Project Structure

- `handlers.js` — Core game logic including API handlers for move, start, end, and info.  
- `index.js` — Entry point for the Battlesnake server.  
- `tests/` — Contains unit and integration tests for core logic and utilities.  
- `.github/workflows/` — GitHub Actions workflows for CI/CD automation.  
- `.eslintrc.js` — ESLint configuration file for enforcing code style.

---

## Testing

Run all tests with:

```bash
npm test
```

Tests include validation of game logic, flood fill pathfinding, and core Battlesnake API handlers. The CI pipeline runs tests automatically on every commit.

---

## Acknowledgments

- The Battlesnake community and official documentation for guidance on building bots.  
- Our university instructors and classmates for collaboration and feedback.  
- Open-source projects like ESLint and GitHub Actions for tooling support.
