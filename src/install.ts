import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import * as io from '@actions/io'
import {getOS, getArch, getDownloadURL} from './version'
import * as github from '@actions/github'
import * as path from 'path'
import {Tool, Action} from './const'
import {promises as fsp} from 'fs'

type ClientType = ReturnType<typeof github.getOctokit>

function addInputVariableToEnv(input: string, env: string) {
  const value = core.getInput(input)
  if (value) {
    core.exportVariable(env, value)
  }
}

export function getHomeDir(): string {
  let homedir = ''

  if (process.platform === 'win32') {
    homedir = process.env['USERPROFILE'] || 'C:\\'
  } else {
    homedir = `${process.env.HOME}`
  }

  core.info(`home dir: ${homedir}`)
  return homedir
}

export function getToolName(name: string, os: string): string {
  if (process.platform === 'win32') {
    return `${name}.exe`
  } else {
    return `${name}`
  }
}

export async function createWorkDir(): Promise<string> {
  const workDir = path.join(getHomeDir(), Action.WorkDirName)
  await io.mkdirP(workDir)
  core.debug(`workDir: ${workDir}`)
  return workDir
}

export async function createTempDir(workDir: string): Promise<string> {
  const tempDir = path.join(workDir, Action.TempDirName)
  await io.mkdirP(tempDir)
  core.debug(`tempDir: ${tempDir}`)
  return tempDir
}

export async function testTool(cmd: string, args: string[]) {
  let output = ''

  const options = {
    listeners: {
      stdout: (data: Buffer): void => {
        output += data.toString()
      }
    }
  }

  const exitcode = await exec.exec(cmd, args, options)
  core.debug(`command: ${cmd} ${args}`)
  core.debug(`exit code: ${exitcode}`)
  core.debug(`stdout: ${output}`)
}

export async function setUpTool() {
  const github_token = core.getInput('github-token', {required: true})
  const client: ClientType = github.getOctokit(github_token)

  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  const data = await client.rest.actions.getWorkflowRun({
    owner,
    repo,
    run_id: github.context.runId
  })
  addInputVariableToEnv('allure-endpoint', 'ALLURE_ENDPOINT')
  addInputVariableToEnv('allure-token', 'ALLURE_TOKEN')
  addInputVariableToEnv('allure-project-id', 'ALLURE_PROJECT_ID')
  core.exportVariable(
    'ALLURE_JOB_UID',
    `${owner}/${repo}/actions/workflows/${data.data.workflow_id}`
  )
}

export async function getVersion(inputVersion: string): Promise<string> {
  const github_token = core.getInput('github-token', {required: true})
  const client: ClientType = github.getOctokit(github_token)

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
  core.info(`version: ${version}`)

  const os: string = getOS(process.platform)
  const arch: string = getArch(process.arch)
  core.info(`platform: ${os}/${arch}`)

  const toolURL: string = getDownloadURL(os, arch, version)
  core.info(`download: ${toolURL}`)

  let toolPath = tc.find('allurectl', version, arch)
  if (toolPath) {
    core.info(`allurectl found in cache ${toolPath}`)
  } else {
    const allurectlBinary: string = await tc.downloadTool(toolURL)
    await fsp.chmod(allurectlBinary, 0o755)

    const toolName = getToolName(Tool.CmdName, os)
    toolPath = await tc.cacheFile(
      allurectlBinary,
      toolName,
      Tool.CmdName,
      version,
      arch
    )
  }
  core.addPath(toolPath)
  await testTool(Tool.CmdName, [Tool.CmdOptVersion])

  await setUpTool()
}
