let noClicks = 1;
const maxNoClicks = 4;
const minNoScale = 0.65;
let noScale = 1;
let yesScale = 1; // This now tracks the scaling factor directly
const gifElement = document.getElementById("pocoyo-gif");
const noButton = document.getElementById("no-btn");
const yesButton = document.getElementById("yes-btn");
const buttonContainer = document.querySelector(".btn-container");
const yesButtonStyle = window.getComputedStyle(yesButton);
const maxYesWidth = parseFloat(yesButtonStyle.maxWidth);

// array of gifs - in order
const gifs = ["assets/images/cupid-pocoyo.gif", "assets/images/pocoyo-disappointed.gif", "assets/images/pocoyo-mad.gif", "assets/images/negando-pocoyo.gif"];
// array of messages
const buttonMessages = ["Are you sure??", "please", "PLEASE", "Why are you like this?"];

// no button clicked
noButton.addEventListener("click", () => {
    if (noClicks < maxNoClicks) {
        // change image
        gifElement.src = gifs[noClicks];
    }

    // change no button text
    noButton.textContent = buttonMessages[noClicks % maxNoClicks];

    // Adjust button width to fit text
    noButton.style.width = 'auto';
    noButton.style.width = `${noButton.scrollWidth}px`;

    // decrease the size of the no button (shrink)
    if (noScale > minNoScale) {
        noScale = Math.max(minNoScale, +(noScale - 0.1).toFixed(2));
    }

    // ensure transform origin is top-left so positioning is stable
    noButton.style.transformOrigin = 'top left';
    noButton.style.transform = `scale(${noScale})`;

    // Calculate the scaled width of the yesButton
    const baseWidth = parseFloat(yesButtonStyle.width);
    const scaledWidth = baseWidth * yesScale; // Reflects the actual visual size of the button

    // Check if the scaled width is less than the max width and adjust yes button if needed
    if (scaledWidth < maxYesWidth) {
        yesScale += 0.5; // Increment scale by a smaller step
        yesButton.style.transform = `scale(${yesScale})`;

        // Get the current gap scale factor from CSS
        const rootStyles = getComputedStyle(document.documentElement);
        const gapScaleFactor = parseFloat(rootStyles.getPropertyValue("--gap-scale-factor")) || 250;

        // Adjust the gap dynamically
        const currentGap = parseFloat(buttonContainer.style.gap) || 20;
        const newGap = Math.sqrt(currentGap * gapScaleFactor); // Scale based on the factor
        buttonContainer.style.gap = `${newGap}px`;
    }

    // Move the no button to a random non-overlapping location
    (function moveNoButtonAvoidingCollisions() {
        // helper: rect intersection
        function rectsIntersect(a, b) {
            return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
        }

        // get protected rects
        const yesRect = yesButton.getBoundingClientRect();
        const gifRect = gifElement.getBoundingClientRect();

        // gather visible text elements on the page to protect their rects
        const textRects = Array.from(document.querySelectorAll('body *'))
            .filter(el => {
                if (el === noButton || el === yesButton || el === gifElement) return false;
                if (!(el instanceof Element)) return false;
                const style = getComputedStyle(el);
                if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) === 0) return false;
                // avoid tiny elements like icons or the buttons themselves
                const txt = (el.innerText || el.textContent || '').trim();
                if (!txt) return false;
                return true;
            })
            .map(el => el.getBoundingClientRect())
            // ignore extremely small rects (likely decorative)
            .filter(r => r.width > 12 && r.height > 10);

        const protectedRects = [yesRect, gifRect, ...textRects];

        // measure the no button's visual size (after scale)
        const noRectCurrent = noButton.getBoundingClientRect();
        const elW = noRectCurrent.width;
        const elH = noRectCurrent.height;

        const padding = 8; // keep this far from edges
        const maxAttempts = 100;
        let placed = false;
        let attempt = 0;
        let candidateX = 0;
        let candidateY = 0;

        while (!placed && attempt < maxAttempts) {
            attempt++;
            candidateX = Math.floor(Math.random() * Math.max(1, (window.innerWidth - elW - padding * 2))) + padding;
            candidateY = Math.floor(Math.random() * Math.max(1, (window.innerHeight - elH - padding * 2))) + padding;

            const candidateRect = {
                left: candidateX,
                top: candidateY,
                right: candidateX + elW,
                bottom: candidateY + elH
            };

            // don't overlap any protected rect (yes button, gif, or visible text)
            const overlapsProtected = protectedRects.some(pr => rectsIntersect(candidateRect, pr));
            if (!overlapsProtected) {
                placed = true;
                break;
            }
        }

        if (placed) {
            // position fixed so coordinates are viewport-based and stable
            noButton.style.position = 'fixed';
            noButton.style.left = `${candidateX}px`;
            noButton.style.top = `${candidateY}px`;
            noButton.style.transition = 'left 0.28s ease, top 0.28s ease, transform 0.12s ease';
        }
        // if not placed, leave it where it is (shrunk)
    })();

    // increment the number of clicks
    noClicks++;
});
