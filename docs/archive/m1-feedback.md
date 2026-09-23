* The main paper block should have the title of the paper as the title, right now it is showing *What*
* The familiar as a star button is not that intuitive, basically I want that to be treated as - I know this term, and once clicked hide that term box with a slight animation.
* All familiar salient terms should be visibily shown differently than the ones user doesn't have in their familiar library , e.g., a small tick at the top right of the word could be useful
* Box should never overlap
* When I move one and click on one ssalient term, the page jumps
* The current salient term detection are for trivial terms such as usefulnees, I only consider something salient if it needs a non-dictionary definnition. Otherwise the tool loses its value
* user should be able to have access to the full paper
* I need a better way to distinguish title vs. explanation in each box, they are almost the same size, once is only all caps, which is not great
* for the familiar terms under terms/familiar, keep the definintion also on the same page, so a chip design sound off, we will later on allow them to filter and find those terms

# round 2 feedback
* I like the styling of the paper title, showing "Paper" at the top, and the title below it, do it for terms boxes (I asked you to remove that before, but now it makes sense)
* the styling of all boxes should be the same, *How* boxes now have a different structure, it should be
   - *Paper* Change to *What*
   - *Why* keep but match the style of *Paper*
   - *What* keep but match the style of *Paper*
   - *Definition* instead of empty for term boxes
* user should be able to introdude new salient terms by selecting a part of the text and once selected be able to click on "define"
* user should be able to hide one node, instead of collapse all next levels at the parent
* right now we have a cycle, a term "Residual learning network" in its definnition says "A Residual learning network is..." which is a cyclic definnition, the exact term which is being defined shouldn't be a salient term in its own box