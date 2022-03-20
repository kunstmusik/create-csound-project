#!/usr/bin/env node

// based on create-vite by Evan You (https://github.com/vitejs/vite/tree/main/packages/create-vite)

// @ts-check
const fs = require('fs-extra')
const path = require('path')
// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
// eslint-disable-next-line node/no-restricted-require
const prompts = require('prompts')
const {
  yellow,
  green,
  cyan,
  blue,
  magenta,
  lightRed,
  red,
  reset
} = require('kolorist')

const cwd = process.cwd()

// const TEMPLATES = [
//   {
//     name: 'desktop',
//     color: yellow,
//     variants: [
//       {
//         name: 'Standard',
//         display: 'JavaScript',
//         color: yellow
//       },
//       {
//         name: 'vanilla-ts',
//         display: 'TypeScript',
//         color: blue
//       }
//     ]
//   },
//   {
//     name: 'vue',
//     color: green,
//     variants: [
//       {
//         name: 'vue',
//         display: 'JavaScript',
//         color: yellow
//       },
//       {
//         name: 'vue-ts',
//         display: 'TypeScript',
//         color: blue
//       }
//     ]
//   },
//   {
//     name: 'react',
//     color: cyan,
//     variants: [
//       {
//         name: 'react',
//         display: 'JavaScript',
//         color: yellow
//       },
//       {
//         name: 'react-ts',
//         display: 'TypeScript',
//         color: blue
//       }
//     ]
//   },
//   {
//     name: 'preact',
//     color: magenta,
//     variants: [
//       {
//         name: 'preact',
//         display: 'JavaScript',
//         color: yellow
//       },
//       {
//         name: 'preact-ts',
//         display: 'TypeScript',
//         color: blue
//       }
//     ]
//   },
//   {
//     name: 'lit',
//     color: lightRed,
//     variants: [
//       {
//         name: 'lit',
//         display: 'JavaScript',
//         color: yellow
//       },
//       {
//         name: 'lit-ts',
//         display: 'TypeScript',
//         color: blue
//       }
//     ]
//   },
//   {
//     name: 'svelte',
//     color: red,
//     variants: [
//       {
//         name: 'svelte',
//         display: 'JavaScript',
//         color: yellow
//       },
//       {
//         name: 'svelte-ts',
//         display: 'TypeScript',
//         color: blue
//       }
//     ]
//   }
// ]

// const TEMPLATES = FRAMEWORKS.map(
//   (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name]
// ).reduce((a, b) => a.concat(b), [])

const templates = [{
    name: 'standard',
    description: 'Standard Csound Project'
}]

const renameFiles = {
  _gitignore: '.gitignore'
}

async function init() {
  let targetDir = argv._[0]
//   let template = argv.template || argv.t

  const defaultProjectName = !targetDir ? 'csound-project' : targetDir

  let result = {}

  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultProjectName,
          onState: (state) =>
            (targetDir = state.value.trim() || defaultProjectName)
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            (targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`) +
            ` is not empty. Remove existing files and continue?`
        },
        {
          type: (_, { overwrite } = {}) => {
            if (overwrite === false) {
              throw new Error(red('✖') + ' Operation cancelled')
            }
            return null
          },
          name: 'overwriteChecker'
        },
        {
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          name: 'packageName',
          message: reset('Package name:'),
          initial: () => toValidPackageName(targetDir),
          validate: (dir) =>
            isValidPackageName(dir) || 'Invalid package.json name'
        },
        {
            type: 'text',
            name: 'author',
            message: "Author name:"
        },
        {
          type: 'select',
          name: 'template',
          message: reset('Select a template:'),
          initial: 0,
          choices: templates.map((template) => {
            // const frameworkColor = framework.color
            return {
            //   title: frameworkColor(framework.name),
              title: `${template.name} - ${template.description}`,
              value: template 
            }
          })
        },
    //     {
    //       type: (framework) =>
    //         framework && framework.variants ? 'select' : null,
    //       name: 'variant',
    //       message: reset('Select a variant:'),
    //       // @ts-ignore
    //       choices: (framework) =>
    //         framework.variants.map((variant) => {
    //           const variantColor = variant.color
    //           return {
    //             title: variantColor(variant.name),
    //             value: variant.name
    //           }
    //         })
    //     }
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled')
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    return
  }

  // user choice associated with prompts
  const { overwrite, packageName, author, template } = result

  const root = path.join(cwd, targetDir)

  if (overwrite) {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root)
  }

  // determine template
//   template = variant || framework || template

  console.log(`\nCreating project in ${root}...`)

  const templateDir = path.join(__dirname, `template-${template.name}`)

  const write = (file, content) => {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file)
  }

  const pkg = require(path.join(templateDir, `package.json`))

  pkg.name = packageName || targetDir
  pkg.author = author;

  write('package.json', JSON.stringify(pkg, null, 2))

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      console.log('  yarn start')
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run start`)
      break
  }
  console.log()
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  )
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path) {
  return fs.readdirSync(path).length === 0
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    const abs = path.resolve(dir, file)
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      fs.rmdirSync(abs)
    } else {
      fs.unlinkSync(abs)
    }
  }
}

/**
 * @param {string | undefined} userAgent process.env.npm_config_user_agent
 * @returns object | undefined
 */
function pkgFromUserAgent(userAgent) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  }
}

init().catch((e) => {
  console.error(e)
})