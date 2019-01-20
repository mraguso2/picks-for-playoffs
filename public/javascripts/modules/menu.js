import { $ } from './bling';

function toggleMenu() {
  const navbar = $('nav.nav');
  const header = $('.top');

  if (this.classList.contains('content')) {
    const menu = $('#menu');
    if (menu) {
      menu.checked = false;
    }
    navbar.classList.remove('nav__menu--open');
    header.classList.remove('top__menu--open');
    return;
  }

  navbar.classList.toggle('nav__menu--open');
  header.classList.toggle('top__menu--open');
}

export default toggleMenu;
