const $ = selector => document.querySelector(selector);
const moments = [
  {image:'aiscreme-party-smiles.jpg',title:'Birthday party',type:'birthday',alt:'Friends enjoying Aiscrème ice cream at a birthday celebration',post:'DelvC2sD1Vy'},
  {image:'aiscreme-wedding-guests.jpg',title:'Wedding',type:'wedding',alt:'Wedding guests beside the Aiscrème ice cream cart',post:'DeGfDQmD96I'},
  {image:'aiscreme-event-setup.jpg',title:'Our setup',type:'setup',alt:'The Aiscrème cart, ice cream cones and toppings at an outdoor event',post:'DeDawv-vnMq'},
  {image:'aiscreme-happy-guest.jpg',title:'Birthday party',type:'birthday',alt:'A smiling birthday party guest holding her Aiscrème ice cream',post:'DelvC2sD1Vy'},
  {image:'aiscreme-garden-party.jpg',title:'Garden wedding',type:'wedding',alt:'Two guests with their ice cream at an outdoor wedding',post:'DeGfDQmD96I'},
  {image:'aiscreme-wedding-friends.jpg',title:'Wedding guests',type:'wedding',alt:'A group of wedding guests gathering at the Aiscrème cart',post:'DeGfDQmD96I'}
];
let currentPhoto = 0;
let visiblePhotos = moments.map((_, id) => id);
function renderMoments(filter = 'all') {
  const selected = moments.map((photo,id) => ({...photo,id})).filter(photo => filter === 'all' || photo.type === filter);
  visiblePhotos = selected.map(photo => photo.id);
  $('#moments').innerHTML = selected.map(photo => `<button class="moment-card" data-photo="${photo.id}"><span class="moment-image"><img src="./assets/${photo.image}" alt="${photo.alt}" loading="lazy" width="1080" height="1440"></span><span class="moment-caption">${photo.title}<span aria-hidden="true">↗</span></span></button>`).join('');
  document.querySelectorAll('#filters button').forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  $('#photo-count').textContent = selected.length + ' photos';
}
function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()); }
function showPhoto(id) {
  const photo = moments[id];
  if (!photo) return;
  currentPhoto = id;
  $('#photo-title').textContent = photo.title;
  $('#full-photo').src = './assets/' + photo.image;
  $('#full-photo').alt = photo.alt;
  $('#photo-source').href = 'https://www.instagram.com/p/' + photo.post + '/';
  $('#photo-position').textContent = (visiblePhotos.indexOf(id) + 1) + ' / ' + visiblePhotos.length;
  document.querySelectorAll('[data-photo-step]').forEach(button => { button.disabled = visiblePhotos.length < 2; });
  if (!$('#photo-dialog').open) openDialog('photo-dialog');
}
function stepPhoto(direction) {
  const index = visiblePhotos.indexOf(currentPhoto);
  showPhoto(visiblePhotos[(index + direction + visiblePhotos.length) % visiblePhotos.length]);
}
function openDialog(id) {
  closeDialogs();
  syncDialogViewport();
  $('#' + id).showModal();
  if (id === 'menu') $('.mobile-menu').setAttribute('aria-expanded', 'true');
}
function syncDialogViewport() {
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty('--dialog-height', (viewport?.height ?? window.innerHeight) + 'px');
  document.documentElement.style.setProperty('--dialog-top', (viewport?.offsetTop ?? 0) + 'px');
}
let viewportFrame = 0;
function scheduleDialogViewport() {
  if (viewportFrame || !document.querySelector('dialog[open]')) return;
  viewportFrame = requestAnimationFrame(() => { viewportFrame = 0; syncDialogViewport(); });
}
window.visualViewport?.addEventListener('resize', scheduleDialogViewport);
window.visualViewport?.addEventListener('scroll', scheduleDialogViewport);
window.addEventListener('resize', scheduleDialogViewport);
$('#menu').addEventListener('close', () => $('.mobile-menu').setAttribute('aria-expanded', 'false'));
const desktopNavigation = window.matchMedia('(min-width: 861px)');
desktopNavigation.addEventListener('change', event => {
  if (event.matches && $('#menu').open) $('#menu').close();
});
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
    showPhoto(Number(control.dataset.photo));
  }
  if (control.dataset.photoStep) stepPhoto(Number(control.dataset.photoStep));
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
    $('#enquiry-status').textContent = 'Copied. Paste it into an Instagram message.';
  } catch {
    $('#enquiry-status').textContent = 'Select and copy the message below, then open Instagram.';
    $('#enquiry-message').focus();
    $('#enquiry-message').select();
  }
});
document.addEventListener('keydown', event => {
  if (!$('#photo-dialog').open) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepPhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    document.querySelectorAll('.nav-left a').forEach(link => {
      if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, {rootMargin: '-90px 0px -45% 0px', threshold: 0});
['collection', 'shop', 'contact'].forEach(id => sectionObserver.observe($('#' + id)));
renderMoments();
