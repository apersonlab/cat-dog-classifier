// 개·고양이 판별 — 브라우저에서 사전학습 MobileNet으로 추론한다.
//
// MobileNet은 ImageNet 1000개 클래스를 예측한다. 그중:
//   - 개 품종: 클래스 인덱스 151~268
//   - 고양이:  클래스 인덱스 281~285 (tabby, tiger cat, Persian, Siamese, Egyptian)
// 두 구간의 확률 합을 비교해 더 큰 쪽으로 판별한다.
const DOG_RANGE = [151, 268];
const CAT_RANGE = [281, 285];
const MIN_CONFIDENCE = 0.2;

const fileInput = document.getElementById('file');
const preview = document.getElementById('preview');
const resultEl = document.getElementById('result');
const statusEl = document.getElementById('status');

let model = null;

async function loadModel() {
  statusEl.textContent = '모델 로딩 중…';
  model = await mobilenet.load({ version: 2, alpha: 1.0 });
  statusEl.textContent = '사진을 선택하세요';
  fileInput.disabled = false;
}

function rangeSum(data, [start, end]) {
  let sum = 0;
  for (let i = start; i <= end; i++) sum += data[i];
  return sum;
}

async function classify(imgEl) {
  const logits = model.infer(imgEl, false);
  const probs = tf.softmax(logits);
  const data = await probs.data();
  logits.dispose();
  probs.dispose();

  render(rangeSum(data, DOG_RANGE), rangeSum(data, CAT_RANGE));
}

function render(dog, cat) {
  const pct = (x) => (x * 100).toFixed(1) + '%';

  let verdict;
  if (Math.max(dog, cat) < MIN_CONFIDENCE) {
    verdict = '개도 고양이도 잘 안 보여요 🤔';
  } else if (dog >= cat) {
    verdict = `개예요 🐶 (${pct(dog)})`;
  } else {
    verdict = `고양이예요 🐱 (${pct(cat)})`;
  }

  resultEl.innerHTML =
    `<strong>${verdict}</strong>` +
    '<div class="bars">' +
    `<div>🐶 개 <span>${pct(dog)}</span><i style="width:${pct(dog)}"></i></div>` +
    `<div>🐱 고양이 <span>${pct(cat)}</span><i style="width:${pct(cat)}"></i></div>` +
    '</div>';
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  resultEl.textContent = '';
  preview.src = URL.createObjectURL(file);
});

preview.addEventListener('load', async () => {
  if (!model) return;
  statusEl.textContent = '분석 중…';
  await classify(preview);
  URL.revokeObjectURL(preview.src);
  statusEl.textContent = '다른 사진도 확인해 보세요';
});

loadModel();
