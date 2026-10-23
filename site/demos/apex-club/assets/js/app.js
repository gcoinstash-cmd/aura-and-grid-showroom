/**
 * APEX CLUB — Global Interactive Helper & Toast Notifications
 */
window.showToast = (message, type = 'crimson') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'crimson' 
    ? 'bg-[#181114] border-[#E11D48]/50 text-white shadow-[0_4px_24px_rgba(225,29,72,0.3)]' 
    : 'bg-[#121215] border-white/20 text-white shadow-xl';

  toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-xs font-mono-apex pointer-events-auto transition-all duration-300 transform translate-y-4 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full ${type === 'crimson' ? 'bg-[#E11D48] animate-ping' : 'bg-emerald-400'}"></span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};
