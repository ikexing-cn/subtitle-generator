import { file } from 'bun'
import { resolve } from 'path'
import { unlinkSync, createWriteStream } from 'node:fs'

import fg from 'fast-glob'
import compressing from 'compressing'

const input = '文案.txt'
const output = '字幕.srt'
const filterWords = ['预览', '标题', '链接', '源码']

const isDev = process.env?.ENVIRONMENT === 'dev'
const fullPath = (_input: string) => isDev
  ? resolve(import.meta.dir, '.dev-dir', _input)
  : resolve(import.meta.dir, _input)

// FIXME: bun does't supports chinese dir
const unlinkSyncCompat = (uri: string) => unlinkSync(uri)

function resolveSrtContent(content: string, index: number) {
  const time = (_index = index) => _index - 10 >= 0 ? _index : `0${_index}`
  const format = `${index + 1}\n00:00:${time()},000 --> 00:00:${time(index + 1)},000`
  return `${format}\n${content}\n\n`
}

for (const entry of await fg(fullPath('*.zip')))
  unlinkSyncCompat(entry)

const inputPath = fullPath(input)
const inputFile = file(inputPath)
const inputFileContent = await inputFile.text()

const outputPath = fullPath(output)
const outputFile = file(outputPath)
if (await outputFile.exists())
  unlinkSyncCompat(outputPath)

const write = outputFile.writer()

let _index = 0
let title = ''
for (const line of inputFileContent.split('\n')) {
  if (filterWords.some((item) => line.startsWith(item)) || !line) {
    if (line.startsWith('标题')) {
      title = line.replace('标题：', '')
    }
    continue
  }

  write.write(resolveSrtContent(line, _index++))
}

write.flush()

const screenFlowPath = fullPath('ScreenFlow.mp4')
const toZipStream = new compressing.zip.Stream()
toZipStream.addEntry(inputPath)
toZipStream.addEntry(outputPath)
toZipStream.addEntry(screenFlowPath)
toZipStream.pipe(createWriteStream(fullPath(`${title}.zip`)) as any)

unlinkSyncCompat(outputPath)
!isDev && unlinkSyncCompat(screenFlowPath)
