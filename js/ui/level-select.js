// Scalable level-card rendering. Progress state and click behavior remain in js/game.js.
(()=>{
const digits=['零','一','二','三','四','五','六','七','八','九'];
function formatNumber(value){
  const n=Number(value);
  if(!Number.isInteger(n)||n<0)return String(value);
  if(n<10)return digits[n];
  if(n===10)return '十';
  if(n<20)return '十'+digits[n%10];
  if(n<100)return digits[Math.floor(n/10)]+'十'+(n%10?digits[n%10]:'');
  return String(n);
}
function render(container,levelIds,levelUi){
  if(!container)throw new Error('Level grid is missing');
  const fragment=document.createDocumentFragment();
  levelIds.forEach((id,index)=>{
    const button=document.createElement('button');
    button.className='levelCard'+(index===0?'':' locked');
    button.dataset.level=String(id);
    const number=document.createElement('div');
    number.className='levelNo';
    number.textContent='第'+formatNumber(id)+'关';
    button.appendChild(number);
    const description=levelUi[id]?.cardDescription;
    if(description){
      const detail=document.createElement('div');
      detail.className='levelDesc';detail.textContent=description;
      button.appendChild(detail);
    }
    fragment.appendChild(button);
  });
  container.replaceChildren(fragment);
}
window.ZHEBAO_LEVEL_SELECT={formatNumber,render};
})();
