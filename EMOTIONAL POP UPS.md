# Emotional Pop-ups

Every message the app can show a parent, and the onboarding answer that triggers it.

One is delivered per day at **07:00 local**. If the app is open it appears as a
centred card; if not it arrives as a notification, and the **same** message is
shown on screen the next time the app is opened — so a parent who was busy at 7am
still receives it rather than losing it.

The message is chosen once per day and stored, so the notification and the
in-app card can never disagree.

`{name}` is replaced with the parent's first name. Where no name is on file the
placeholder is removed and the sentence is re-capitalised, so it still reads
correctly.

**Source of truth:** `src/lib/content/affirmations.ts`. This document is
generated from it — edit the source, not this file.

---

## Tone rules

Applied to all 300 messages:

- Speak **to** them, never about parenting in the abstract
- **Name the thing they admitted** — do not soften it into nothing
- Never instruct, never sell, never mention the app
- Short enough to survive a notification banner unclipped

---

## Contents

- [Which of these sounds like you?](#which-of-these-sounds-like-you)
- [One word for you as a parent right now](#one-word-for-you-as-a-parent-right-now)
- [What is hardest day to day?](#what-is-hardest-day-to-day)
- [What gets to you most?](#what-gets-to-you-most)
- [Which of these do you carry?](#which-of-these-do-you-carry)
- [What do you worry about for them?](#what-do-you-worry-about-for-them)
- [What are you doing well?](#what-are-you-doing-well)
- [What do you fear most?](#what-do-you-fear-most)
- [What would you like to change in six months?](#what-would-you-like-to-change-in-six-months)
- [What are you committing to?](#what-are-you-committing-to)

---

## Which of these sounds like you?

`youAreNotAloneResponse` · 5 options · 25 messages

Shown early, to establish they are not alone.

### "I'm doing my best but I'm tired"

`doing_best_tired`

1. {name}, tired and still showing up is not a lesser kind of love. It's the harder kind.
2. You're running on empty and still turning up, {name}. Your children are being raised by someone who doesn't quit.
3. {name}, the days you got through on fumes still counted. All of them.
4. Being exhausted doesn't cancel out being good at this, {name}. It usually means you're doing plenty.
5. {name}, you said you're doing your best while tired. That's most of parenting, and you're doing it.

### "I love them but I feel overwhelmed"

`love_overwhelmed`

1. {name}, feeling overwhelmed doesn't dilute the love. It's usually proof of how much there is.
2. You love them enormously and it's a lot to carry, {name}. Both things are allowed to be true.
3. {name}, overwhelm is what caring deeply feels like when there's no time to put it down.
4. The love isn't the problem, {name}. The load is. Your children only ever feel the love.
5. {name}, you're not drowning in the wrong thing. You're carrying something worth carrying.

### "I worry I'm not enough"

`worry_not_enough`

1. {name}, parents who worry they aren't enough are almost never the ones who aren't.
2. That fear you named — not being enough — is the sound of someone taking this seriously, {name}.
3. {name}, your children aren't measuring you. They're just glad you're there.
4. Enough isn't a score, {name}. It's whether you keep coming back. You do.
5. {name}, the parents who never wonder if they're enough are rarely the ones worth worrying about.

### "I feel judged"

`feel_judged`

1. {name}, the people watching aren't the ones raising your children. You are.
2. You've felt judged, {name}. Your children aren't judging. They're just at home with you.
3. {name}, nobody else has your full picture. Their opinion was always incomplete.
4. The judgement you felt says more about them than about your family, {name}.
5. {name}, you don't owe anyone an explanation for how you love your children.

### "I feel proud"

`feel_proud`

1. {name}, you said you feel proud. Hold on to that — it's earned, not given.
2. Pride in your family isn't arrogance, {name}. It's noticing something real.
3. {name}, you're allowed to be proud of this. Most parents forget to be.
4. That pride you named — your children can feel it too, {name}.
5. {name}, you built something worth being proud of. Say it more often.

---

## One word for you as a parent right now

`parentIdentityWord` · 7 options · 35 messages

Their own self-description.

### Committed

`committed`

1. {name}, commitment is the least glamorous thing about parenting and by far the most important.
2. You called yourself committed, {name}. Your children experience that as safety.
3. {name}, showing up again today is the whole job. You keep doing it.
4. Commitment isn't loud, {name}. It's just you, still here, every single day.
5. {name}, your children will remember that you never stopped turning up.

### Trying

`trying`

1. We see you, {name}. Your children see you too — they know you're trying.
2. {name}, trying is not a consolation prize. It's the thing itself.
3. You said you're trying, {name}. That's more than most, and your children feel it.
4. {name}, nobody gets this right. The ones who keep trying are the ones who get there.
5. Trying, on a hard day, with no one clapping — that's you, {name}. That counts.

### Learning

`learning`

1. {name}, you're learning in public with no manual. That takes real courage.
2. You called yourself learning, {name}. Your children get to watch someone grow. That's a gift.
3. {name}, the parents who think they've finished learning are the ones to worry about.
4. Every parent is improvising, {name}. You're just honest enough to admit it.
5. {name}, learning as you go is not falling behind. It's paying attention.

### Stressed

`stressed`

1. {name}, stressed isn't a character flaw. It's a signal you're carrying a lot.
2. You named the stress, {name}. Naming it is how it stops running the house.
3. {name}, a stressed parent who keeps going is still a present parent.
4. The pressure is real, {name}. So is everything you're managing to hold together underneath it.
5. {name}, you're allowed to find this hard. It is hard.

### Patient

`patient`

1. {name}, patience is the thing your children will try hardest to spend. You keep finding more.
2. You called yourself patient, {name}. That's a rarer gift than you think.
3. {name}, every calm response you gave today was a choice. They add up.
4. Patience isn't the absence of frustration, {name}. It's what you do with it.
5. {name}, your steadiness is what makes home feel safe.

### Firm

`firm`

1. {name}, holding a boundary when it would be easier not to is love doing hard work.
2. You called yourself firm, {name}. Children feel safest with edges they can find.
3. {name}, saying no is one of the kindest things a parent does.
4. Firmness isn't coldness, {name}. Your children will understand that eventually.
5. {name}, the structure you hold is the reason they can relax.

### Lost sometimes

`lost_sometimes`

1. {name}, feeling lost sometimes doesn't mean you've gone the wrong way.
2. You admitted you feel lost sometimes, {name}. That honesty is worth more than false certainty.
3. {name}, every parent is lost sometimes. Most just don't say it out loud.
4. Being unsure and staying anyway — that's what your children actually need, {name}.
5. {name}, you don't need the whole map. You just need to keep walking with them.

---

## What is hardest day to day?

`dailyPainPoints` · 7 options · 35 messages

Multi-select — a parent may pick several, widening their pool.

### Mornings

`mornings`

1. {name}, mornings are hard in almost every home. You're not failing a test everyone else passes.
2. Getting everyone out of the door counts as a win, {name}. Even the messy ones.
3. {name}, nobody has calm mornings every day. You just have to get through them.
4. The chaos before school isn't a sign of a bad home, {name}. It's a sign of a full one.
5. {name}, one smoother morning this week is progress. It doesn't have to be all of them.

### Homework

`homework`

1. {name}, homework battles are exhausting and almost universal. You're not alone in it.
2. You're teaching them to keep going when it's boring, {name}. That's the real lesson.
3. {name}, their relationship with you matters more than any single assignment.
4. Homework will end, {name}. How you handled it together is what stays.
5. {name}, sitting with a frustrated child is hard work. You do it anyway.

### Mealtimes

`mealtimes`

1. {name}, food struggles wear parents down more than anyone admits.
2. You keep feeding them, {name}, even when every meal is negotiated. That's dedication.
3. {name}, the table is the hardest room in the house. You keep showing up to it.
4. Their eating will change, {name}. Your patience is what they'll remember.
5. {name}, a difficult mealtime isn't a failed day.

### Screen time

`screen_time`

1. {name}, you're up against something engineered to be hard to switch off. Be fair to yourself.
2. Every parent alive is fighting this one, {name}. You're not behind.
3. {name}, wanting their attention back isn't controlling. It's caring.
4. The screen argument is exhausting, {name}. Having it anyway is love.
5. {name}, small limits held consistently beat perfect rules you can't keep.

### Bedtime

`bedtime`

1. {name}, bedtime is where everyone's patience runs out — including yours. That's normal.
2. You keep the routine going even at the end of your energy, {name}.
3. {name}, the last hour of the day is the hardest. You do it every night.
4. Nobody wins bedtime every night, {name}. Getting them to sleep at all is the job.
5. {name}, they feel safe enough to resist sleep. That's a strange kind of compliment.

### Not listening

`not_listening`

1. {name}, being ignored all day is genuinely wearing. Your frustration makes sense.
2. They're not listening because they're children, {name}. Not because you're failing.
3. {name}, repeating yourself for the fifth time and staying calm is real work.
4. It doesn't feel like it, {name}, but they are absorbing more than they show.
5. {name}, your voice matters to them more than their behaviour suggests today.

### Too tired

`too_tired`

1. {name}, you're parenting through exhaustion. That's the hardest version of it.
2. Tired parents still raise happy children, {name}. You're proof.
3. {name}, resting isn't giving up. You can't pour from empty forever.
4. You've done a lot today on very little, {name}.
5. {name}, the tiredness is real. So is everything you managed anyway.

---

## What gets to you most?

`emotionalTrigger` · 6 options · 30 messages

The moment that most often tips them over.

### Repeating myself and not being heard

`repeating_not_heard`

1. {name}, saying it again and again is draining. Your patience is not infinite and that's human.
2. You feel unheard, {name}. You're not — it just takes children far longer than it should.
3. {name}, repetition is how children learn. It's also how parents get worn out. Both are true.
4. It lands eventually, {name}. Long after you've stopped believing it does.
5. {name}, being ignored isn't a verdict on you.

### Feeling like I'm failing

`feeling_failing`

1. {name}, the feeling of failing and the fact of failing are not the same thing.
2. Parents who feel like they're failing are usually the ones paying closest attention, {name}.
3. {name}, you'd have to care enormously to feel this. That's the part your children get.
4. One hard day isn't the whole story, {name}. It isn't even most of it.
5. {name}, you are not failing them. You're tired, and that lies to you.

### Raising my voice

`raising_voice`

1. {name}, shouting and then regretting it is one of the most common things in parenting.
2. You noticed it and you didn't like it, {name}. That's the part that matters.
3. {name}, repair matters more than never slipping. Children learn from watching you come back.
4. Losing your temper doesn't undo everything else you are, {name}.
5. {name}, the fact this weighs on you says everything about the parent you're trying to be.

### Bad habits forming

`bad_habits`

1. {name}, the habits you're worried about are almost always a phase with a long name.
2. Noticing early is half the work, {name}.
3. {name}, they're testing what the world does. That's how habits form and unform.
4. You're not ignoring it, {name}. That already puts you ahead.
5. {name}, habits shift. Your steadiness while they do is what changes them.

### Not enough time

`not_enough_time`

1. {name}, time is the one thing no parent has enough of. You're not mismanaging it.
2. The minutes you do get with them count more than you think, {name}.
3. {name}, children measure presence, not hours.
4. You're stretched thin, {name}. They still feel chosen.
5. {name}, a short moment fully with them beats a long one half-there. You give them both.

### Feeling disconnected

`disconnected`

1. {name}, feeling disconnected is painful precisely because the connection matters so much.
2. The distance you're feeling is usually temporary, {name}. The bond underneath isn't.
3. {name}, noticing the gap is the first step in closing it. Most never notice.
4. You want to be closer to them, {name}. They want that too, even when they can't show it.
5. {name}, connection comes back. It usually comes back quietly.

---

## Which of these do you carry?

`guiltReflection` · 5 options · 25 messages

The guilt they admitted to.

### "I wish I were more patient"

`wish_patient`

1. {name}, wishing you were more patient is what patient people sound like.
2. You lose patience because you're human, {name}, not because you're unkind.
3. {name}, they don't need a saint. They need you, coming back after the hard moments.
4. Patience is a daily allowance, {name}. Some days it just runs out earlier.
5. {name}, the wish itself is proof of the parent you are.

### "I should be doing better"

`should_better`

1. {name}, 'I should be doing better' is the most common sentence in parenting and one of the least accurate.
2. Better than what, {name}? You're measuring against a standard nobody meets.
3. {name}, you're doing more than you're giving yourself credit for.
4. That voice telling you it isn't enough — it's wrong more often than it's right, {name}.
5. {name}, you'd never speak to your children the way you speak to yourself.

### "I hope I don't mess them up"

`dont_mess_up`

1. {name}, the fear of messing them up is carried by nearly every good parent.
2. You won't get it all right, {name}. Nobody does, and children are built for that.
3. {name}, they're far more resilient than the fear tells you.
4. Repair matters more than perfection, {name}. You're already good at repair.
5. {name}, your children are not a project you can fail. They're people you love.

### "My parents did it differently"

`parents_different`

1. {name}, choosing to do it differently from how you were raised takes real courage.
2. You're breaking a pattern, {name}. That's slow, lonely work and you're doing it.
3. {name}, your children will never know what you protected them from. That's the point.
4. Doing it differently means having no map, {name}. You're drawing one.
5. {name}, the cycle stopping with you is not a small thing.

### "I'm learning as I go"

`learning_as_i_go`

1. {name}, everyone is learning as they go. You're just honest about it.
2. There's no version of this you were trained for, {name}.
3. {name}, learning in front of your children teaches them it's safe to not know things.
4. You're figuring it out in real time, {name}, and they're doing fine.
5. {name}, admitting you're learning is a strength, not a gap.

---

## What do you worry about for them?

`childWorry` · 7 options · 35 messages

Their fear for the child, not themselves.

### Discipline

`discipline`

1. {name}, worrying about boundaries means you're thinking past today. That's parenting.
2. Structure is a gift you're giving them, {name}, even when they fight it.
3. {name}, the limits you hold now are the ones they'll hold for themselves later.
4. Discipline isn't punishment, {name}. It's teaching, and you're doing it.
5. {name}, they push because they trust the wall will hold. It does.

### Confidence

`confidence`

1. {name}, a child whose parent worries about their confidence usually grows into it.
2. Confidence is built at home, {name}, in ordinary moments you're already giving them.
3. {name}, they borrow their belief from you first. Keep lending it.
4. You noticing this is why it will change, {name}.
5. {name}, being seen by you is where their confidence starts.

### Focus

`focus`

1. {name}, focus develops slowly and unevenly. You're not behind.
2. They're not lazy, {name}. Attention is a skill, and skills take years.
3. {name}, your patience while they build it matters more than the speed.
4. Every child finds their concentration eventually, {name}, usually later than we'd like.
5. {name}, you're teaching them to return to the task. That's the whole ability.

### Habits

`habits`

1. {name}, habits are built in repetition, and repetition is exactly what you're providing.
2. The routines you keep are shaping them quietly, {name}.
3. {name}, they'll carry your habits long after they stop copying you openly.
4. You're playing a long game, {name}. Long games are hard to see mid-way.
5. {name}, small consistent things beat big occasional ones. You do the small things.

### Their future

`future`

1. {name}, worrying about their future is love pointed forward.
2. You can't control what comes, {name}. You're preparing them anyway.
3. {name}, the best preparation you can give is exactly what you're doing — being there.
4. Their future has you in it, {name}. That's already an advantage.
5. {name}, don't let a future you can't see steal the day you're in.

### Emotional health

`emotional_health`

1. {name}, caring about how they feel — not just how they behave — changes everything.
2. You're raising someone who'll know their own feelings, {name}. That's rare.
3. {name}, a child who can talk to their parent has something most people never had.
4. Their emotional safety starts with you noticing, {name}. You're noticing.
5. {name}, you worry about their inner world. Most parents never think to.

### Safety

`safety`

1. {name}, wanting them safe is the oldest instinct there is. It doesn't make you overprotective.
2. You can't remove every risk, {name}. You can be the place they come back to.
3. {name}, they feel safe because of choices you make without being thanked.
4. The worry never fully goes, {name}. It just means you're paying attention.
5. {name}, home is safe because you made it that way.

---

## What are you doing well?

`parentStrength` · 6 options · 30 messages

The one they are proudest of.

### Showing love

`show_love`

1. {name}, they know they're loved. Ask any child what matters and it's that.
2. You said you show love well, {name}. That's the foundation everything else sits on.
3. {name}, the affection you give freely is what they'll give their own children.
4. Love expressed out loud is not a small thing, {name}. Many never get it.
5. {name}, whatever else is hard, they are certain of you. That's enormous.

### Providing

`provide`

1. {name}, providing is unglamorous, invisible and constant. You do it anyway.
2. They have what they need because of you, {name}. They may never see the effort.
3. {name}, the security you provide is felt long before it's understood.
4. Keeping a family going is real work, {name}. You're doing it.
5. {name}, providing is a daily act of love that nobody applauds.

### Protecting

`protect`

1. {name}, they sleep easily because you're standing between them and the world.
2. You said you protect them well, {name}. That's the deepest job there is.
3. {name}, safety is a feeling before it's a fact. You give them both.
4. The things you shield them from, they'll never know about, {name}. That's the point.
5. {name}, being their safe place is not a small role.

### Teaching values

`teach_values`

1. {name}, you're raising who they'll be, not just how they behave today.
2. Values are caught more than taught, {name}, and they're watching you closely.
3. {name}, what you model at home becomes what they consider normal. Choose it, as you do.
4. You're thinking about their character, {name}. That's long-term parenting.
5. {name}, the standards you hold will outlive every argument about them.

### Being present

`present`

1. {name}, presence is the rarest thing a child can be given now. You give it.
2. You said you're present, {name}. That's what they'll remember — not the things.
3. {name}, being there is most of it. You're there.
4. Attention is the purest form of love, {name}, and you spend it on them.
5. {name}, they'll remember you were in the room. Fully.

### Learning

`learning`

1. {name}, calling learning your strength shows real self-awareness.
2. You're growing alongside them, {name}. They get to watch that.
3. {name}, a parent who keeps learning raises a child who keeps learning.
4. Willingness to change is a strength most adults lose, {name}. You kept it.
5. {name}, you're better at this than you were a year ago. That continues.

---

## What do you fear most?

`parentFear` · 6 options · 30 messages

Their deepest stated fear.

### They'll drift away from me

`drift_away`

1. {name}, the fear of losing closeness is usually strongest in the closest parents.
2. Children pull away and come back, {name}. The coming back is the part that lasts.
3. {name}, staying reachable matters more than staying close every day.
4. They'll drift, {name}. They'll also return, and they'll know where to.
5. {name}, the thread doesn't break just because it goes slack for a while.

### I'll fail them

`fail_them`

1. {name}, the fear of failing them is carried only by parents who won't.
2. You'll get things wrong, {name}. That isn't failure — it's the job.
3. {name}, they don't need you flawless. They need you honest and present.
4. Failing them would look like not caring, {name}. Look at how much you care.
5. {name}, this fear is a compass, not a verdict.

### I won't prepare them

`not_prepare`

1. {name}, you're preparing them right now in ways you can't measure yet.
2. No parent finishes the job feeling ready, {name}. They leave anyway, and they're fine.
3. {name}, resilience is built by small ordinary days like the one you just had.
4. You're giving them a base, {name}. They'll build the rest themselves.
5. {name}, they'll be more ready than you think, because of you.

### I'm too strict

`too_strict`

1. {name}, worrying you're too strict is what stops a parent becoming so.
2. Boundaries with warmth aren't strictness, {name}. They're structure.
3. {name}, they'll understand the rules much later than you'd like. They will understand.
4. You're checking yourself, {name}. Strict parents don't do that.
5. {name}, firm and loving is a hard balance and you're actively holding it.

### I'm too soft

`too_soft`

1. {name}, worrying you're too soft usually means your instinct is kindness. That's not a flaw.
2. Gentle parents raise secure children, {name}. Softness isn't weakness.
3. {name}, you can be warm and still hold a line. You already do both.
4. Being loved generously never harmed a child, {name}.
5. {name}, the fact you're asking the question means you'll find the balance.

### I'll repeat my parents' mistakes

`repeat_mistakes`

1. {name}, fearing you'll repeat what was done to you is the exact reason you won't.
2. You noticed the pattern, {name}. Noticing is where cycles break.
3. {name}, doing it differently is exhausting and invisible. It's also working.
4. The past doesn't get a vote here, {name}. You do.
5. {name}, your children are getting a different childhood because you decided they would.

---

## What would you like to change in six months?

`hopeChange` · 6 options · 30 messages

Also drives the 5-hour re-engagement nudge.

### Less stress

`less_stress`

1. {name}, you wanted a calmer home. Calm is built in small ordinary choices, and you're making them.
2. Less stress isn't a destination, {name}. It's a few better days strung together.
3. {name}, a calmer you is the fastest route to a calmer house.
4. You asked for peace, {name}. It arrives quietly and in pieces.
5. {name}, you're closer to it than the loud days suggest.

### Better routines

`better_routines`

1. {name}, you wanted better routines. Routines are just repeated decisions, and you keep making them.
2. Every rhythm your family has, you built, {name}.
3. {name}, structure takes weeks to feel natural. Keep going.
4. You wanted order, {name}. Children settle into it faster than parents expect.
5. {name}, the routine doesn't have to be perfect to work.

### More cooperation

`more_cooperation`

1. {name}, you hoped for more cooperation. It comes slowly, then suddenly.
2. They're learning to work with you, {name}, not against you. It just takes time.
3. {name}, cooperation grows out of connection, and you're building that daily.
4. You wanted fewer battles, {name}. Every calm one you handle teaches them something.
5. {name}, they will meet you halfway. Often later than you'd like.

### Stronger connection

`stronger_connection`

1. {name}, you wanted to feel closer to them. Wanting it is most of how it happens.
2. Connection is built in unremarkable moments, {name}. You've had some today.
3. {name}, they want closeness with you too, even when they hide it.
4. You asked for a stronger bond, {name}. It grows where attention goes.
5. {name}, the closeness you want is already partly there.

### Clearer structure

`clearer_structure`

1. {name}, you wanted clarity. Children relax when they know what happens next — you're giving them that.
2. Structure isn't rigidity, {name}. It's a shape they can trust.
3. {name}, clear expectations are one of the kindest things you can offer.
4. You wanted less guesswork at home, {name}. That's a fair thing to want.
5. {name}, the clearer it gets, the calmer they get.

### More peace

`more_peace`

1. {name}, you wanted peace at home. That's not too much to ask for.
2. Peace isn't silence, {name}. It's the feeling that things are basically okay.
3. {name}, a peaceful home is built, not found. You're building it.
4. You asked for calm, {name}. Some of today probably was.
5. {name}, the peace you want will arrive without announcing itself.

---

## What are you committing to?

`commitment` · 5 options · 25 messages

The promise they made at the end of onboarding.

### Becoming a better parent

`better_parent`

1. {name}, you committed to becoming a better parent. You already are — that's what commitment does.
2. Better isn't a finish line, {name}. It's the direction you're facing.
3. {name}, wanting to improve at this is itself a form of love.
4. You made a promise to yourself, {name}. Your children are the beneficiaries.
5. {name}, small improvements compound. Yours are.

### Peace at home

`peace_home`

1. {name}, you committed to a peaceful home. That commitment is felt long before it's achieved.
2. Peace at home starts with one person deciding, {name}. You decided.
3. {name}, your children will grow up describing home as calm. That's your doing.
4. You chose peace over winning, {name}. That's a hard, good choice.
5. {name}, the atmosphere in your house is largely yours to set. You're setting it.

### My children thriving

`children_thrive`

1. {name}, you committed to them thriving, not just coping. That's an ambitious kind of love.
2. Thriving children usually have a parent who insisted on it, {name}.
3. {name}, you're aiming higher than survival. They'll feel the difference.
4. You want more for them than you had, {name}. That's how families change.
5. {name}, they're growing up with someone in their corner. That's the whole thing.

### Structure, not chaos

`structure_not_chaos`

1. {name}, you chose structure over chaos. That's a daily decision and you keep making it.
2. Order at home takes constant effort, {name}. Nobody sees it but everybody feels it.
3. {name}, the calm you're building costs you something. It's worth it.
4. You committed to less chaos, {name}. Every routine you hold is that promise kept.
5. {name}, structure is love with a timetable.

### Loving them clearly

`love_clarity`

1. {name}, you committed to loving them clearly. Children need love they can actually see.
2. Clear love leaves no room for doubt, {name}. That's a gift.
3. {name}, they'll never have to wonder where they stand with you.
4. You chose to make it obvious, {name}. Many parents assume it's understood.
5. {name}, saying it plainly is the kindest thing you can do.

---

## Totals

| | |
|---|---|
| Questions | 10 |
| Options | 60 |
| Messages | 300 |
| Messages per option | 5 |

A parent selecting one option per question draws from **50** messages.
Multi-select questions widen that further — each extra pain point adds 5 more.

A parent who answered **no** choice questions receives nothing. That is deliberate:
a generic platitude would be worse than silence, and would undermine every real message.

---

*Generated from `src/lib/content/affirmations.ts`.*
