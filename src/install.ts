import { addPath, debug, exportVariable, getInput, info } from '@actions/core'
import { exec } from '@actions/exec'
import { cacheFile, downloadTool, find } from '@actions/tool-cache'
import { getOS, getArch, getDownloadURL } from './version'
import { context, getOctokit } from '@actions/github'
import { Tool } from './const'
import { promises as fsp } from 'node:fs'

function addInputVariableToEnv(input: string, env: string): void {
  const value = getInput(input)
  if (value) {
    exportVariable(env, value)
  }
}

export function getToolName(name: string): string {
  if (process.platform === 'win32') {
    return `${name}.exe`
  } else {
    return `${name}`
  }
}

export async function testTool(cmd: string, args: string[]): Promise<void> {
  let output = ''

  const options = {
    listeners: {
      stdout: (data: Buffer): void => {
        output += data.toString()
      }
    }
  }

  const exitcode = await exec(cmd, args, options)
  debug(`command: ${cmd} ${args}`)
  debug(`exit code: ${exitcode}`)
  debug(`stdout: ${output}`)
}

export async function setUpTool(): Promise<void> {
  const github_token = getInput('github-token', { required: true })
  const client = getOctokit(github_token)

  const owner = context.repo.owner
  const repo = context.repo.repo
  const data = await client.rest.actions.getWorkflowRun({
    owner,
    repo,
    run_id: context.runId
  })
  addInputVariableToEnv('allure-endpoint', 'ALLURE_ENDPOINT')
  addInputVariableToEnv('allure-token', 'ALLURE_TOKEN')
  addInputVariableToEnv('allure-project-id', 'ALLURE_PROJECT_ID')
  exportVariable(
    'ALLURE_JOB_UID',
    `${owner}/${repo}/actions/workflows/${data.data.workflow_id}`
  )
}

export async function getVersion(inputVersion: string): Promise<string> {
  const github_token = getInput('github-token', { required: true })
  const client = getOctokit(github_token)

  if (inputVersion && inputVersion !== 'latest') {
    const response = await client.rest.repos.getReleaseByTag({
      owner: Tool.Owner,
      repo: Tool.Repo,
      tag: inputVersion
    })
    if (response.status === 200) {
      return response.data.tag_name
    } else {
      throw new Error(`Release ${inputVersion} not found`)
    }
  } else {
    const response = await client.rest.repos.getLatestRelease({
      owner: Tool.Owner,
      repo: Tool.Repo
    })
    return response.data.tag_name
  }
}

export async function install(inputVersion: string): Promise<void> {
  const version = await getVersion(inputVersion)
  info(`version: ${version}`)

  const os: string = getOS(process.platform)
  const arch: string = getArch(process.arch)
  info(`platform: ${os}/${arch}`)

  const toolURL: string = getDownloadURL(os, arch, version)
  info(`download: ${toolURL}`)

  let toolPath = find('allurectl', version, arch)

  if (toolPath) {
    info(`allurectl found in cache ${toolPath}`)
  } else {
    const allurectlBinary: string = await downloadTool(toolURL)
    await fsp.chmod(allurectlBinary, 0o755)

    const toolName = getToolName(Tool.CmdName)

    toolPath = await cacheFile(
      allurectlBinary,
      toolName,
      Tool.CmdName,
      version,
      arch
    )
  }
  addPath(toolPath)
  await testTool(Tool.CmdName, [Tool.CmdOptVersion])
  await setUpTool()
}
