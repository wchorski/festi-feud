# festi-feud
Database pouchDB | Built with HTML + CSS + JS

A festival's take on a classic TV game show.

## Survey Says
I want to collect data from real people (festival goers). Having them submit their answers

Problem: having people put in their own answers is a bit of a mess. Maybe do the live polling like Facebook does where people can submit their answers and vote on existing ones. This means I don't have to make the questions multiple choice, but also don't get a bunch of varied answers

DO NOT SHOW or RANK the answers during the poll to avoid bias. But we could seed the answers with a few common options. 

### Similar Answers

> The questions and the tabulated answers were then passed along to Cathy Hughart Dawson. She would pore through the individual answers and combine answers that expressed similar ideas. For example, let’s say a question was “Name something you buy at a pawn shop.” If 11 people wrote “jewelry,” 9 people wrote “necklace,” 6 people wrote “earrings,” and 5 people wrote “bracelet,” she might combine those answers to show that 31 people said “jewelry.”

Maybe use some sort of fuzzy comparison or AI to condense these answers for similar sounding (or misspelled versions)

> One quirk of _Family Feud_—the game is about guessing what many people _think_, not necessarily what people _know_. Factually incorrect answers are given the same consideration as correct answers, and an answer that’s somehow “wrong” could appear on the board if enough people said it.

>compensated with souvenir bumper stickers and buttons reading “I’m a _Family Feud_ Pollee!”
### How The Show Collects its answers
- https://www.museumofplay.org/blog/family-feud/
- https://www.cheatsheet.com/news/family-feud-how-the-show-discreetly-finds-100-people-for-its-surveys.html/

## Question Modes

Pulling questions from the database should have a few options
1. Question sets 
	- group questions for themed rounds
	- good for live polling where answers are directly from the audience in attendance.
	- 
2. Randomize (pull from any groups, or certain groups)
	- good for pop up games that don't have audience and just want to play with friends. 
	- 

## The Tech
### Database
PouchDB will allow me to source answers locally (on iPad) and sync/aggregate data when added onto a closed network with CouchDB server.

Surveyors can periodically sync by coming back in range of the server's network to cover more ground. 

> [!warning] Avoid Spam & Bots
> I want to make these surveys as accessible and anonymous. Meaning no accounts or identification to vote in the polls. 
> 
> When collecting answers online, I need to figure out how to avoid multi submissions from the same person. I can put in some safe guards like localStorage flags and IP comparing to help. It isn't bullet proof tho.
### Data Models
`answer`
```json
{
	"_id": "1",
	"questionId": "123",
	"text": "this is my submitted answer",
	"votes" 13,
}
```

`question`
```json
{
	"_id": "1",
	"categoryId" "123",
	"text": "What is your favorite color?",
}
```

## Todos
- [ ] `/questions` page where you can vote on existing and insert new answers
  - [ ] either `/questions?id=123` or `/questions/123` to go to individual
- [ ] `/play` page where you pull in questions with corrisponsing answers
  - [ ] with category and tag filters
- [ ] make a homepage `/` that explains how to play and participate


## Existing Repos
- https://github.com/jasonfill/family-feud
- https://github.com/tiwoc/clan-contest
- https://github.com/timlohnes/familyfeud?tab=readme-ov-file
- https://github.com/MacEvelly/Family_Feud