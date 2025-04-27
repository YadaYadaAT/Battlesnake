# Battlesnake CI/CD Automation

![Build Status]()
![Lint Status]()

Welcome to the **Battlesnake CI/CD Automation** repository! This project is a part of our university coursework, where we not only build a fun and competitive Battlesnake game, but also learn how to integrate key DevOps principles like continuous integration, continuous delivery, and agile issue tracking. 

## Table of Contents

- [About the Project](#about-the-project)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
- [Running the Game](#running-the-game)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

---

## About the Project

In this project, we configure our Battlesnake game while setting up CI/CD pipelines using GitHub Actions. We aim to streamline our development process by integrating **YouTrack** for issue management, ensuring that each sprint is efficient and well-organized. Through this project, we will:
- Learn how to use **GitHub Actions** for continuous integration and delivery.
- Track our work and sprints using **YouTrack**.
- Develop our Battlesnake game following agile methodologies.
- Reflect on our progress and deliver comprehensive reports on the development lifecycle.

This project is configured to run CI pipelines using Github Actions, ensuring that:
- Code is linted with ESLint.
- All tests are automatically run on every push and pull request.

## Technologies

This project makes use of the following technologies:
- **Battlesnake Game API**
- **GitHub Actions** for CI/CD
- **YouTrack** for issue and sprint management
- **JavaScript** for the Battlesnake logic
- **ESLint** for code linting
- **Node.js** for backend support and testing

## Getting Started

To get a local copy of the project up and running, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```
   git clone https://github.com/YadaYadaAT/Battlesnake.git
   cd Battlesnake
   ```
2. **Install dependencies:**
   ```
   npm install
   ```
3. **Set up environment variables:** Create a .env file in the root directory and add any necessary environment variables based on your setup.

## Running the Game

To start your Battlesnake server locally:
```
npm run dev --snakes <number-of-snakes>
```
The <number-of-snakes> argument should be an integer number up to 6.

## Contributing 

## Acknowledgments
