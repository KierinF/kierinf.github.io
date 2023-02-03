console.log('hi')

const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const button3 = document.getElementById("button3");
const gif = document.querySelector(".gif");
const gifHeading = document.querySelector(".gif-heading");
const gifP = document.querySelector(".gif-p");
const gifButton = document.querySelector(".gif-button");

button1.addEventListener("click", (e) => {
    e.preventDefault();
    gif.src = "./images/Discover_Gif.gif";
    gifHeading.innerHTML = "Find new places";
    gifP.innerHTML = "See recommendations from friends, locals, and others with similar interests.";
    gifButton.innerHTML = "Start Discovering";
    button1.style.opacity = '1';
    button2.style.opacity = '0.5';
    button3.style.opacity = '.5';
});

button2.addEventListener("click", (e) => {
    e.preventDefault();
    gif.src = "./images/Quests_Gif.gif";
    gifHeading.innerHTML = "Explore your city";
    gifP.innerHTML = "Embark on quests with others, or ride solo and challenge yourself.";
    gifButton.innerHTML = "Begin Exploring";
    button2.style.opacity = '1';
    button1.style.opacity = '0.5';
    button3.style.opacity = '.5';
});

button3.addEventListener("click", (e) => {
    e.preventDefault();
    gif.src = "./images/Feed_Gif.gif";
    gifHeading.innerHTML = "See other’s adventures";
    gifP.innerHTML = "Keep up-to date with friends, see what others are doing, and share your own adventures.";
    gifButton.innerHTML = "Start Your Journey";
    button3.style.opacity = '1';
    button1.style.opacity = '0.5';
    button2.style.opacity = '.5';
});

