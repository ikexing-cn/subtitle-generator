import { file } from 'bun'
import { resolve } from 'path'
import { unlinkSync } from 'node:fs'

const input = '文案.txt'
const output = '字幕.srt'
const filterWords = ['预览', '标题', '链接', '源码']

const fullPath = (_input: string) =>resolve(import.meta.dir, _input)

function resolveSrtContent(content: string, index: number) {
  const format = `00:00:${index - 10 >= 0 ? index : `0${index}`},000 --> 00:00:0${index + 1},000`
  return `${format}\n${content}\n\n`
}

const inputFile = file(fullPath(input))
const inputFileContent = await inputFile.text()

const outputFile = file(fullPath(output))
if (await outputFile.exists()) {
  unlinkSync(fullPath(output))
}
const write = outputFile.writer()

let _index = 0
for (const line of inputFileContent.split('\n')) {
  if (filterWords.some((item) => line.startsWith(item)) || !line) {
    continue
  }

  write.write(resolveSrtContent(line, _index++))
}

write.flush()
write.end()
