document.addEventListener('DOMContentLoaded', () => {
    const flipCard = document.querySelector('.flip-card-inner');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    if (showRegister && flipCard) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            flipCard.classList.add('flipped');
        });
    }

    if (showLogin && flipCard) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            flipCard.classList.remove('flipped');
        });
    }
});
