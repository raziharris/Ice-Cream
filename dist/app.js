const $ = selector => document.querySelector(selector);
const moments = [
  {image:'aiscreme-party-smiles.jpg',title:'A scoop between friends',type:'birthday',alt:'Friends enjoying Aiscrème ice cream at a birthday celebration',post:'DelvC2sD1Vy'},
  {image:'aiscreme-wedding-guests.jpg',title:'Love, laughter & ice cream',type:'wedding',alt:'Wedding guests beside the Aiscrème ice cream cart',post:'DeGfDQmD96I'},
  {image:'aiscreme-event-setup.jpg',title:'Our little corner, all set',type:'setup',alt:'The Aiscrème cart, ice cream cones and toppings at an outdoor event',post:'DeDawv-vnMq'},
  {image:'aiscreme-happy-guest.jpg',title:'A sweet birthday moment',type:'birthday',alt:'A smiling birthday party guest holding her Aiscrème ice cream',post:'DelvC2sD1Vy'},
  {image:'aiscreme-garden-party.jpg',title:'Garden party, extra sweet',type:'wedding',alt:'Two guests with their ice cream at an outdoor wedding',post:'DeGfDQmD96I'},
  {image:'aiscreme-wedding-friends.jpg',title:'Good company by the cart',type:'wedding',alt:'A group of wedding guests gathering at the Aiscrème cart',post:'DeGfDQmD96I'}
];
function renderMoments(filter = 'all') {
  const selected = moments.map((photo,id) => ({...photo,id})).filter(photo => filter === 'all' || photo.type === filter);
  $('#moments').innerHTML = selected.map(photo => `<button class="moment-card" data-photo="${photo.id}"><span class="moment-image"><img src="./assets/${photo.image}" alt="${photo.alt}" loading="lazy" width="1080" height="1440"></span><span class="moment-caption">${photo.title}<span aria-hidden="true">↗</span></span></button>`).join('');
  document.querySelectorAll('#filters button').forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  $('#photo-count').textContent = selected.length + ' happy moments';
}
function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()); }
function openDialog(id) { closeDialogs(); $('#' + id).showModal(); }
document.addEventListener('click',event => {
  const control = event.target.closest('button,a');
  if (!control) return;
  if (control.matches('.close')) control.closest('dialog').close();
  if (control.dataset.open) openDialog(control.dataset.open);
  if (control.dataset.filter) renderMoments(control.dataset.filter);
  if (control.dataset.enquire) {
    $('#occasion').value = control.dataset.enquire;
    $('#enquiry-status').textContent = '';
    $('#enquiry-message').hidden = true;
    openDialog('enquiry');
  }
  if (control.dataset.photo !== undefined) {
    const photo = moments[Number(control.dataset.photo)];
    if (!photo) return;
    $('#photo-title').textContent = photo.title;
    $('#full-photo').src = './assets/' + photo.image;
    $('#full-photo').alt = photo.alt;
    $('#photo-source').href = 'https://www.instagram.com/p/' + photo.post + '/';
    openDialog('photo-dialog');
  }
  if (control.closest('#menu') && control.tagName === 'A') closeDialogs();
});
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click',event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));
$('#enquiry-form').addEventListener('submit',async event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const date = data.get('date');
  const dateLabel = date ? new Date(date + 'T12:00:00').toLocaleDateString('en-MY',{day:'numeric',month:'long',year:'numeric'}) : 'To be confirmed';
  const message = [
    'Hi Aiscrème! I’d like to ask about ice cream catering.',
    'Occasion: ' + data.get('occasion'),
    'Date: ' + dateLabel,
    'Guests: ' + (data.get('guests') || 'To be confirmed'),
    'Location: ' + (data.get('location') || 'To be confirmed'),
    'Could you share your availability and package details?'
  ].join('\n');
  $('#enquiry-message').value = message;
  $('#enquiry-message').hidden = false;
  try {
    await navigator.clipboard.writeText(message);
    $('#enquiry-status').textContent = 'Copied! Open Instagram and paste your enquiry into a message.';
  } catch {
    $('#enquiry-status').textContent = 'Your enquiry is ready below. Select and copy it, then send it on Instagram.';
    $('#enquiry-message').focus();
    $('#enquiry-message').select();
  }
});
renderMoments();
