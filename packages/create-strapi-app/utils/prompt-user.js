'use strict';

const inquirer = require('inquirer');
const axios = require('axios');
const yaml = require('js-yaml');
const logger = require('../../create-strapi-starter/utils/logger');

/**
 * @param {Object} projectArgs - The arguments needed to create a project
 * @param {string|null} projectArgs.projectName - The name/path of project
 * @param {string|null} projectArgs.template - The Github repo of the template
 * @param {boolean} projectArgs.useQuickstart - Check quickstart flag was set
 * @param {string} cliType - The type of cli: starters or templates
 * @returns
 */
module.exports = async function promptUser(projectArgs) {
  const questions = await getPromptQuestions(projectArgs);
  const prompt = await inquirer.prompt(questions);

  return prompt;
};

async function getPromptOptions() {
  const content = await getStarterData(`templates/templates.yml`);
  const options = content.map(option => {
    const name = option.title.replace('Template', '');
    return {
      name,
      value: `https://github.com/${option.repo}`,
    };
  });

  return options;
}

async function getPromptQuestions(projectArgs) {
  const { projectName, template, useQuickstart } = projectArgs;
  const options = await getPromptOptions();
  const separator = new inquirer.Separator();
  const choices = [{ name: 'None', value: null }, separator, ...options];

  return [
    {
      type: 'input',
      default: projectName || 'my-strapi-project',
      name: 'directory',
      message: 'What would you like to name your project?',
      when: !projectName || !template,
    },
    {
      type: 'list',
      name: 'selected',
      message: `Would you like to use a template? (Templates are Strapi configurations designed for a specifc use case)`,
      pageSize: choices.length,
      when: !template,
      choices,
    },
    {
      type: 'list',
      name: 'quick',
      message: 'Choose your installation type',
      choices: [
        {
          name: 'Quickstart (recommended)',
          value: true,
        },
        {
          name: 'Custom (manual settings)',
          value: false,
        },
      ],
      when: !useQuickstart,
    },
  ];
}

async function getStarterData() {
  try {
    const {
      data: { content },
    } = await axios.get(
      `https://api.github.com/repos/strapi/community-content/contents/templates/templates.yml`
    );

    const buff = Buffer.from(content, 'base64');
    const stringified = buff.toString('utf-8');

    return yaml.load(stringified);
  } catch (error) {
    logger.error('Failed to fetch template data');
    process.exit(1);
  }
}
