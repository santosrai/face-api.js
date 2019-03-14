import * as tf from '@tensorflow/tfjs-core'

export function nonMaxSuppression(
  boxes: tf.Tensor2D,
  scores: number[],
  maxOutputSize: number,
  iouThreshold: number,
  scoreThreshold: number
): number[] {

  const numBoxes = boxes.shape[0]
  const outputSize = Math.min(
    maxOutputSize,
    numBoxes
  )

  const candidates = scores
    .map((score, boxIndex) => ({ score, boxIndex }))
    .filter(c => c.score > scoreThreshold)
    .sort((c1, c2) => c2.score - c1.score)

  const suppressFunc = (x: number) => x <= iouThreshold ? 1 : 0

  const selected: number[] = []

  candidates.forEach(c => {
    if (selected.length >= outputSize) {
      return
    }
    const originalScore = c.score

    for (let j = selected.length - 1; j >= 0; --j) {
      const iou = IOU(boxes, c.boxIndex, selected[j])
      if (iou === 0.0) {
        continue
      }
      c.score *= suppressFunc(iou)
      if (c.score <= scoreThreshold) {
        break
      }
    }

    if (originalScore === c.score) {
      selected.push(c.boxIndex)
    }
  })

  return selected
}

function IOU(boxes: tf.Tensor2D, i: number, j: number) {
  const yminI = Math.min(boxes.arraySync()[i][0], boxes.arraySync()[i][2])
  const xminI = Math.min(boxes.arraySync()[i][1], boxes.arraySync()[i][3])
  const ymaxI = Math.max(boxes.arraySync()[i][0], boxes.arraySync()[i][2])
  const xmaxI = Math.max(boxes.arraySync()[i][1], boxes.arraySync()[i][3])
  const yminJ = Math.min(boxes.arraySync()[j][0], boxes.arraySync()[j][2])
  const xminJ = Math.min(boxes.arraySync()[j][1], boxes.arraySync()[j][3])
  const ymaxJ = Math.max(boxes.arraySync()[j][0], boxes.arraySync()[j][2])
  const xmaxJ = Math.max(boxes.arraySync()[j][1], boxes.arraySync()[j][3])
  const areaI = (ymaxI - yminI) * (xmaxI - xminI)
  const areaJ = (ymaxJ - yminJ) * (xmaxJ - xminJ)
  if (areaI <= 0 || areaJ <= 0) {
    return 0.0
  }
  const intersectionYmin = Math.max(yminI, yminJ)
  const intersectionXmin = Math.max(xminI, xminJ)
  const intersectionYmax = Math.min(ymaxI, ymaxJ)
  const intersectionXmax = Math.min(xmaxI, xmaxJ)
  const intersectionArea =
      Math.max(intersectionYmax - intersectionYmin, 0.0) *
      Math.max(intersectionXmax - intersectionXmin, 0.0)
  return intersectionArea / (areaI + areaJ - intersectionArea)
}