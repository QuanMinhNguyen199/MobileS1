
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');
const search = document.querySelector('#search');
const items = [...document.querySelectorAll('.icon-item')];
const sections = [...document.querySelectorAll('#catalog section')];
search.addEventListener('input', () => {
  const query = normalize(search.value.trim());
  let count = 0;
  for (const item of items) { item.hidden = !normalize(item.dataset.search).includes(query); if (!item.hidden) count++; }
  for (const section of sections) section.hidden = ![...section.querySelectorAll('.icon-item')].some(item => !item.hidden);
  document.querySelector('#result-count').textContent = count + ' biểu tượng';
  document.querySelector('#empty').hidden = count > 0;
});
document.querySelector('#size').addEventListener('change', event => document.documentElement.style.setProperty('--glyph-size', event.target.value + 'px'));
