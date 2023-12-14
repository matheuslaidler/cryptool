document.addEventListener('DOMContentLoaded', function() {
  var toggleFooterCheckbox = document.querySelector('#toggle-footer');
  var footer = document.querySelector('.footer');
  var toggleFooterBtn = document.querySelector('.toggle-footer-btn');

  toggleFooterBtn.addEventListener('click', function() {
    if (footer.style.display === 'none') {
      footer.style.display = 'flex';
      document.documentElement.classList.add('no-scroll'); // Adiciona classe para desabilitar scroll
    } else {
      footer.style.display = 'none';
      document.documentElement.classList.remove('no-scroll'); // Remove classe para habilitar scroll
    }
  });

  // Verifica se o footer está inicialmente aberto para definir o scroll
  if (toggleFooterCheckbox.checked) {
    footer.style.display = 'flex';
    document.documentElement.classList.add('no-scroll'); // Adiciona classe para desabilitar scroll
  } else {
    footer.style.display = 'none';
    document.documentElement.classList.remove('no-scroll'); // Remove classe para habilitar scroll
  }
});