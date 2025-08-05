const homeName = document.getElementById('name');
const underline = document.getElementById('underline');
const button = document.getElementById('button');
const brandStatement = document.querySelector('.brand-statement-container');
const theReason = document.getElementById('the-reason');

// This function will be called every time the user scrolls

console.log(brandStatement)

window.addEventListener('scroll', () => {

    const scrollPosition = window.scrollY;
    const newPosition = 1 + (scrollPosition * 0.5);
    homeName.style.transform = `translateY(${-newPosition * 2}px)`;

    underline.style.transform = `translateY(${-newPosition * 2}px)`;
    button.style.transform = `translateX(${-newPosition * 0.5}px) translateY(${-newPosition * 0.5}px)`;
    brandStatement.style.transform = `translateY(${-newPosition * 1.2}px) `;
    theReason.style.transform = `translateY(${-newPosition * 1}px) `;
});

