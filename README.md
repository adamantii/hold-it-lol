# hold-it-lol
Quality of life [https://objection.lol/courtroom](objection.lol) courtroom features & tweaks, ranging from tiny UI changes to roleplay testimony UIs.

**Important:** the extension is still in beta - some assets are unfinished.

## Options

Upon installation, there is a page of options with descriptions to personalize your courtroom experience and pick only the features you like.

It can be accessed by clicking the extension icon in the top right (you may need to pin it in the extensions list). (Option preview images are currently... placeholders)

<details>
<summary><i>A full list of features provided by the extension</i></summary>
<blockquote>
<dl>
<dt>Auto-recording</dt>
<dd>Automatically start recording joined courtrooms.</dd>
<dt>Remember last character</dt>
<dd>The last character you used is selected by default in the next courtroom.</dd>
<dt>Clickable chat links</dt>
<dd>URLs in chat messages become clickable. You can <i>also</i> right click to quickly save sounds & music.</dd>
<dt>Auto-closing menus</dt>
<dd>Automatically close formatting menus after you've used them.</dd>
<dt>Open menus by hovering</dt>
<dd>Open formatting menus by hovering over them instead of clicking.</dd>
<dt>Sounds and music: Focused search</dt>
<dd>Simply press enter to choose the top sound in the search list.</dd>
<dt>Sounds and music: Quick inserting</dt>
<dd>Add sounds just by clicking on them in the list.</dd>
<dt>Quickly typing pauses</dt>
<dd>Type , again after a , (or other punctuation marks) to add delays.</dd>
<dt>Effect hotkeys</dt>
<dd>Quickly add the Flash and Shake tags by pressing CTRL + 1, CTRL + 2, or CTRL + 3.</dd>
<dt>Dual effect button</dt>
<dd>Insert both Flash and Shake at the same time.</dd>
<dt>Smart pre-animate</dt>
<dd>Disables your pose's pre-animation until you use a different pose.</dd>
<dt>Smart "to normal" poses</dt>
<dd>When switching to a new pose, automatically plays the previous pose's "to normal" when available.</dd>
<dt>Automatic re-mute</dt>
<dd>Automatically re-mutes a muted user if the rejoin.</dd>
<dt>Moderate from user list</dt>
<dd>Quickly mute, ban anyone or make them a moderator from the user list.</dd>
<dt>Mute only character</dt>
<dd>Someone's character is laggy or unpleasant? Hide just the character, while still seeing their messages.</dd>
<dt>Roleplay testimony</dt>
<dd>A helpful witness testimony player for roleplay.</dd>
<dt>Add evidence from table</dt>
<dd>Automatically add lots of evidence via a copy-pasted table from a document. (Works with tables where each evidence takes up a row)</dd>
<dt>"Now playing..." display</dt>
<dd>Shows the name given to the currently playing track.</dd>
<dt>Text-to-speech</dt>
<dd>Plays messages using wacky text-to-speech voices.</dd>
</dl>
</blockquote>
</details>

## Discussion

If you have any questions, problems or suggestions regarding the extension, you can join our [Discord server](https://discord.gg/wHRCvNrx6Q).

## Installation instructions

1. Download the top .zip file from the [latest release on Github](https://github.com/adamantii/hold-it-lol/releases/tag/v0.6-beta).
1. Unzip the file and you should have a folder named plainly `hold-it-lol`.
1. In your Chrome-based browser go to the extensions page (for Chrome or Edge, `chrome://extensions` or `edge://extensions`).
1. Enable Developer Mode in the top right.
1. Drag the `hold-it-lol` folder onto the page to load it (do not delete the folder afterwards).

## Known Issues

Known bug warnings (as of v0.6 beta):

- Due to the way the extension loads, many UI elements break if you begin spectating a court and then join the court in the same tab; reload and join without spectating to resolve.
- "No talking" toggle button doesn't work. You can still use the [##nt] custom tag to disable talking for a frame.
