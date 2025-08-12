
const homeName = document.getElementById('name');
const underline = document.getElementById('underline');
const button = document.getElementById('button');
const brandStatement = document.querySelector('.brand-statement-container');

const work1 = document.getElementById('work-bg');
const work2 = work1.cloneNode(true);
const work3 = work2.cloneNode(true);

const theReason = document.getElementById('the-reason')



work2.style.backgroundColor = 'rgba(22, 22, 22, 1)';
work3.style.backgroundColor = 'rgba(0, 0, 0, 1)';

// This function will be called every time the user scrolls

work1.style.zIndex = '3'
work2.style.zIndex = '4'
work3.style.zIndex = '5'

work1.parentNode.insertBefore(work2, work1.nextSibling);
work2.parentNode.insertBefore(work3, work1.nextSibling);



window.addEventListener('load', function () {
    document.querySelectorAll('.brand-statement').forEach(function (el) {
        el.classList.add('animate');
    });
});

window.addEventListener('scroll', () => {

    const scrollPosition = window.scrollY;
    const newPosition = 1 + (scrollPosition * 0.5);
    homeName.style.transform = `translateY(${-newPosition * 2}px)`;

    underline.style.transform = `translateY(${-newPosition * 2}px)`;
    button.style.transform = `translateX(${-newPosition * 0.5}px) translateY(${-newPosition * 0.5}px)`;
    brandStatement.style.transform = `translateY(${-newPosition * 1.2}px)`;
    theReason.style.transform = `translateY(${-newPosition * 1.5}px) scale(1.1)`;
    work1.style.transform = `translateY(${-newPosition * 0.6}px)`;
    work2.style.transform = `translateY(${-newPosition * 0.37}px)`;
    work3.style.transform = `translateY(${(-newPosition * 0.2 + 1)}px)`;




});
const workSection = document.querySelector('.work');

button.addEventListener('click', () => {
    workSection.scrollIntoView({ behavior: 'smooth' });
    console.log("hi")
});



