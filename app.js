// 개냥 판별 — 브라우저에서 사전학습 MobileNet으로 추론한다.
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
const dropEl = document.querySelector('.drop');
const dropText = document.querySelector('.drop-text');

let model = null;

async function loadModel() {
  statusEl.textContent = '모델 불러오는 중…';
  model = await mobilenet.load({ version: 2, alpha: 1.0 });
  statusEl.textContent = '사진을 올리면 개인지 고양이인지 알려드려요';
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
  const pct = (x) => Math.round(x * 100) + '%';
  const low = Math.max(dog, cat) < MIN_CONFIDENCE;
  const isDog = dog >= cat;

  const verdict = low ? '음… 잘 모르겠어요'
    : isDog ? '개예요!' : '고양이예요!';
  const icon = low ? '#ic-catCurl' : isDog ? '#ic-dogA' : '#ic-catA';

  resultEl.innerHTML =
    `<div class="verdict"><svg viewBox="0 0 100 100"><use href="${icon}"/></svg>${verdict}</div>` +
    `<div class="bar"><span>개</span><div class="track"><i style="width:${pct(dog)}"></i></div><b>${pct(dog)}</b></div>` +
    `<div class="bar cat"><span>고양이</span><div class="track"><i style="width:${pct(cat)}"></i></div><b>${pct(cat)}</b></div>`;
  resultEl.hidden = false;
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  resultEl.hidden = true;
  preview.src = URL.createObjectURL(file);
}

fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

['dragenter', 'dragover'].forEach((evt) =>
  dropEl.addEventListener(evt, (e) => {
    e.preventDefault();
    dropEl.classList.add('over');
  })
);
['dragleave', 'drop'].forEach((evt) =>
  dropEl.addEventListener(evt, (e) => {
    e.preventDefault();
    dropEl.classList.remove('over');
  })
);
dropEl.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

preview.addEventListener('load', async () => {
  if (!model) return;
  statusEl.textContent = '살펴보는 중…';
  dropText.textContent = '다른 사진을 끌어다 놓기';
  await classify(preview);
  URL.revokeObjectURL(preview.src);
  statusEl.textContent = '다른 사진도 확인해 보세요';
});

loadModel();
