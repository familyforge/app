// Daily affirmations, written against the answers a parent gave at onboarding.
//
// Onboarding asks ten multiple-choice questions about fear, guilt, hope and
// strength. Those answers were previously collected and discarded (see migration
// 019). Now that they are stored, this gives them back — one message a day,
// chosen from the options that parent actually picked.
//
// Every option carries FIVE variants so a parent who picks the same answer does
// not see the same sentence twice in a week.
//
// Tone rules, applied throughout:
//   * speak TO them, never about parenting in the abstract
//   * name the thing they admitted; do not soften it into nothing
//   * never instruct, never sell, never mention the app
//   * short enough to survive a notification banner unclipped
//
// {name} is replaced with the parent's first name at render time.

export type AffirmationField =
  | 'youAreNotAloneResponse'
  | 'parentIdentityWord'
  | 'dailyPainPoints'
  | 'emotionalTrigger'
  | 'guiltReflection'
  | 'childWorry'
  | 'parentStrength'
  | 'parentFear'
  | 'hopeChange'
  | 'commitment';

export const AFFIRMATIONS: Record<AffirmationField, Record<string, string[]>> = {
  // ── "Which of these sounds like you?" ────────────────────────────────────
  youAreNotAloneResponse: {
    doing_best_tired: [
      "{name}, tired and still showing up is not a lesser kind of love. It's the harder kind.",
      "You're running on empty and still turning up, {name}. Your children are being raised by someone who doesn't quit.",
      "{name}, the days you got through on fumes still counted. All of them.",
      "Being exhausted doesn't cancel out being good at this, {name}. It usually means you're doing plenty.",
      "{name}, you said you're doing your best while tired. That's most of parenting, and you're doing it.",
    ],
    love_overwhelmed: [
      "{name}, feeling overwhelmed doesn't dilute the love. It's usually proof of how much there is.",
      "You love them enormously and it's a lot to carry, {name}. Both things are allowed to be true.",
      "{name}, overwhelm is what caring deeply feels like when there's no time to put it down.",
      "The love isn't the problem, {name}. The load is. Your children only ever feel the love.",
      "{name}, you're not drowning in the wrong thing. You're carrying something worth carrying.",
    ],
    worry_not_enough: [
      "{name}, parents who worry they aren't enough are almost never the ones who aren't.",
      "That fear you named — not being enough — is the sound of someone taking this seriously, {name}.",
      "{name}, your children aren't measuring you. They're just glad you're there.",
      "Enough isn't a score, {name}. It's whether you keep coming back. You do.",
      "{name}, the parents who never wonder if they're enough are rarely the ones worth worrying about.",
    ],
    feel_judged: [
      "{name}, the people watching aren't the ones raising your children. You are.",
      "You've felt judged, {name}. Your children aren't judging. They're just at home with you.",
      "{name}, nobody else has your full picture. Their opinion was always incomplete.",
      "The judgement you felt says more about them than about your family, {name}.",
      "{name}, you don't owe anyone an explanation for how you love your children.",
    ],
    feel_proud: [
      "{name}, you said you feel proud. Hold on to that — it's earned, not given.",
      "Pride in your family isn't arrogance, {name}. It's noticing something real.",
      "{name}, you're allowed to be proud of this. Most parents forget to be.",
      "That pride you named — your children can feel it too, {name}.",
      "{name}, you built something worth being proud of. Say it more often.",
    ],
  },

  // ── "One word for you as a parent right now" ─────────────────────────────
  parentIdentityWord: {
    committed: [
      "{name}, commitment is the least glamorous thing about parenting and by far the most important.",
      "You called yourself committed, {name}. Your children experience that as safety.",
      "{name}, showing up again today is the whole job. You keep doing it.",
      "Commitment isn't loud, {name}. It's just you, still here, every single day.",
      "{name}, your children will remember that you never stopped turning up.",
    ],
    trying: [
      "We see you, {name}. Your children see you too — they know you're trying.",
      "{name}, trying is not a consolation prize. It's the thing itself.",
      "You said you're trying, {name}. That's more than most, and your children feel it.",
      "{name}, nobody gets this right. The ones who keep trying are the ones who get there.",
      "Trying, on a hard day, with no one clapping — that's you, {name}. That counts.",
    ],
    learning: [
      "{name}, you're learning in public with no manual. That takes real courage.",
      "You called yourself learning, {name}. Your children get to watch someone grow. That's a gift.",
      "{name}, the parents who think they've finished learning are the ones to worry about.",
      "Every parent is improvising, {name}. You're just honest enough to admit it.",
      "{name}, learning as you go is not falling behind. It's paying attention.",
    ],
    stressed: [
      "{name}, stressed isn't a character flaw. It's a signal you're carrying a lot.",
      "You named the stress, {name}. Naming it is how it stops running the house.",
      "{name}, a stressed parent who keeps going is still a present parent.",
      "The pressure is real, {name}. So is everything you're managing to hold together underneath it.",
      "{name}, you're allowed to find this hard. It is hard.",
    ],
    patient: [
      "{name}, patience is the thing your children will try hardest to spend. You keep finding more.",
      "You called yourself patient, {name}. That's a rarer gift than you think.",
      "{name}, every calm response you gave today was a choice. They add up.",
      "Patience isn't the absence of frustration, {name}. It's what you do with it.",
      "{name}, your steadiness is what makes home feel safe.",
    ],
    firm: [
      "{name}, holding a boundary when it would be easier not to is love doing hard work.",
      "You called yourself firm, {name}. Children feel safest with edges they can find.",
      "{name}, saying no is one of the kindest things a parent does.",
      "Firmness isn't coldness, {name}. Your children will understand that eventually.",
      "{name}, the structure you hold is the reason they can relax.",
    ],
    lost_sometimes: [
      "{name}, feeling lost sometimes doesn't mean you've gone the wrong way.",
      "You admitted you feel lost sometimes, {name}. That honesty is worth more than false certainty.",
      "{name}, every parent is lost sometimes. Most just don't say it out loud.",
      "Being unsure and staying anyway — that's what your children actually need, {name}.",
      "{name}, you don't need the whole map. You just need to keep walking with them.",
    ],
  },

  // ── "What's hardest day to day?" (multi-select) ──────────────────────────
  dailyPainPoints: {
    mornings: [
      "{name}, mornings are hard in almost every home. You're not failing a test everyone else passes.",
      "Getting everyone out of the door counts as a win, {name}. Even the messy ones.",
      "{name}, nobody has calm mornings every day. You just have to get through them.",
      "The chaos before school isn't a sign of a bad home, {name}. It's a sign of a full one.",
      "{name}, one smoother morning this week is progress. It doesn't have to be all of them.",
    ],
    homework: [
      "{name}, homework battles are exhausting and almost universal. You're not alone in it.",
      "You're teaching them to keep going when it's boring, {name}. That's the real lesson.",
      "{name}, their relationship with you matters more than any single assignment.",
      "Homework will end, {name}. How you handled it together is what stays.",
      "{name}, sitting with a frustrated child is hard work. You do it anyway.",
    ],
    mealtimes: [
      "{name}, food struggles wear parents down more than anyone admits.",
      "You keep feeding them, {name}, even when every meal is negotiated. That's dedication.",
      "{name}, the table is the hardest room in the house. You keep showing up to it.",
      "Their eating will change, {name}. Your patience is what they'll remember.",
      "{name}, a difficult mealtime isn't a failed day.",
    ],
    screen_time: [
      "{name}, you're up against something engineered to be hard to switch off. Be fair to yourself.",
      "Every parent alive is fighting this one, {name}. You're not behind.",
      "{name}, wanting their attention back isn't controlling. It's caring.",
      "The screen argument is exhausting, {name}. Having it anyway is love.",
      "{name}, small limits held consistently beat perfect rules you can't keep.",
    ],
    bedtime: [
      "{name}, bedtime is where everyone's patience runs out — including yours. That's normal.",
      "You keep the routine going even at the end of your energy, {name}.",
      "{name}, the last hour of the day is the hardest. You do it every night.",
      "Nobody wins bedtime every night, {name}. Getting them to sleep at all is the job.",
      "{name}, they feel safe enough to resist sleep. That's a strange kind of compliment.",
    ],
    not_listening: [
      "{name}, being ignored all day is genuinely wearing. Your frustration makes sense.",
      "They're not listening because they're children, {name}. Not because you're failing.",
      "{name}, repeating yourself for the fifth time and staying calm is real work.",
      "It doesn't feel like it, {name}, but they are absorbing more than they show.",
      "{name}, your voice matters to them more than their behaviour suggests today.",
    ],
    too_tired: [
      "{name}, you're parenting through exhaustion. That's the hardest version of it.",
      "Tired parents still raise happy children, {name}. You're proof.",
      "{name}, resting isn't giving up. You can't pour from empty forever.",
      "You've done a lot today on very little, {name}.",
      "{name}, the tiredness is real. So is everything you managed anyway.",
    ],
  },

  // ── "What gets to you most?" ─────────────────────────────────────────────
  emotionalTrigger: {
    repeating_not_heard: [
      "{name}, saying it again and again is draining. Your patience is not infinite and that's human.",
      "You feel unheard, {name}. You're not — it just takes children far longer than it should.",
      "{name}, repetition is how children learn. It's also how parents get worn out. Both are true.",
      "It lands eventually, {name}. Long after you've stopped believing it does.",
      "{name}, being ignored isn't a verdict on you.",
    ],
    feeling_failing: [
      "{name}, the feeling of failing and the fact of failing are not the same thing.",
      "Parents who feel like they're failing are usually the ones paying closest attention, {name}.",
      "{name}, you'd have to care enormously to feel this. That's the part your children get.",
      "One hard day isn't the whole story, {name}. It isn't even most of it.",
      "{name}, you are not failing them. You're tired, and that lies to you.",
    ],
    raising_voice: [
      "{name}, shouting and then regretting it is one of the most common things in parenting.",
      "You noticed it and you didn't like it, {name}. That's the part that matters.",
      "{name}, repair matters more than never slipping. Children learn from watching you come back.",
      "Losing your temper doesn't undo everything else you are, {name}.",
      "{name}, the fact this weighs on you says everything about the parent you're trying to be.",
    ],
    bad_habits: [
      "{name}, the habits you're worried about are almost always a phase with a long name.",
      "Noticing early is half the work, {name}.",
      "{name}, they're testing what the world does. That's how habits form and unform.",
      "You're not ignoring it, {name}. That already puts you ahead.",
      "{name}, habits shift. Your steadiness while they do is what changes them.",
    ],
    not_enough_time: [
      "{name}, time is the one thing no parent has enough of. You're not mismanaging it.",
      "The minutes you do get with them count more than you think, {name}.",
      "{name}, children measure presence, not hours.",
      "You're stretched thin, {name}. They still feel chosen.",
      "{name}, a short moment fully with them beats a long one half-there. You give them both.",
    ],
    disconnected: [
      "{name}, feeling disconnected is painful precisely because the connection matters so much.",
      "The distance you're feeling is usually temporary, {name}. The bond underneath isn't.",
      "{name}, noticing the gap is the first step in closing it. Most never notice.",
      "You want to be closer to them, {name}. They want that too, even when they can't show it.",
      "{name}, connection comes back. It usually comes back quietly.",
    ],
  },

  // ── "Which of these do you carry?" ───────────────────────────────────────
  guiltReflection: {
    wish_patient: [
      "{name}, wishing you were more patient is what patient people sound like.",
      "You lose patience because you're human, {name}, not because you're unkind.",
      "{name}, they don't need a saint. They need you, coming back after the hard moments.",
      "Patience is a daily allowance, {name}. Some days it just runs out earlier.",
      "{name}, the wish itself is proof of the parent you are.",
    ],
    should_better: [
      "{name}, 'I should be doing better' is the most common sentence in parenting and one of the least accurate.",
      "Better than what, {name}? You're measuring against a standard nobody meets.",
      "{name}, you're doing more than you're giving yourself credit for.",
      "That voice telling you it isn't enough — it's wrong more often than it's right, {name}.",
      "{name}, you'd never speak to your children the way you speak to yourself.",
    ],
    dont_mess_up: [
      "{name}, the fear of messing them up is carried by nearly every good parent.",
      "You won't get it all right, {name}. Nobody does, and children are built for that.",
      "{name}, they're far more resilient than the fear tells you.",
      "Repair matters more than perfection, {name}. You're already good at repair.",
      "{name}, your children are not a project you can fail. They're people you love.",
    ],
    parents_different: [
      "{name}, choosing to do it differently from how you were raised takes real courage.",
      "You're breaking a pattern, {name}. That's slow, lonely work and you're doing it.",
      "{name}, your children will never know what you protected them from. That's the point.",
      "Doing it differently means having no map, {name}. You're drawing one.",
      "{name}, the cycle stopping with you is not a small thing.",
    ],
    learning_as_i_go: [
      "{name}, everyone is learning as they go. You're just honest about it.",
      "There's no version of this you were trained for, {name}.",
      "{name}, learning in front of your children teaches them it's safe to not know things.",
      "You're figuring it out in real time, {name}, and they're doing fine.",
      "{name}, admitting you're learning is a strength, not a gap.",
    ],
  },

  // ── "What do you worry about for them?" ──────────────────────────────────
  childWorry: {
    discipline: [
      "{name}, worrying about boundaries means you're thinking past today. That's parenting.",
      "Structure is a gift you're giving them, {name}, even when they fight it.",
      "{name}, the limits you hold now are the ones they'll hold for themselves later.",
      "Discipline isn't punishment, {name}. It's teaching, and you're doing it.",
      "{name}, they push because they trust the wall will hold. It does.",
    ],
    confidence: [
      "{name}, a child whose parent worries about their confidence usually grows into it.",
      "Confidence is built at home, {name}, in ordinary moments you're already giving them.",
      "{name}, they borrow their belief from you first. Keep lending it.",
      "You noticing this is why it will change, {name}.",
      "{name}, being seen by you is where their confidence starts.",
    ],
    focus: [
      "{name}, focus develops slowly and unevenly. You're not behind.",
      "They're not lazy, {name}. Attention is a skill, and skills take years.",
      "{name}, your patience while they build it matters more than the speed.",
      "Every child finds their concentration eventually, {name}, usually later than we'd like.",
      "{name}, you're teaching them to return to the task. That's the whole ability.",
    ],
    habits: [
      "{name}, habits are built in repetition, and repetition is exactly what you're providing.",
      "The routines you keep are shaping them quietly, {name}.",
      "{name}, they'll carry your habits long after they stop copying you openly.",
      "You're playing a long game, {name}. Long games are hard to see mid-way.",
      "{name}, small consistent things beat big occasional ones. You do the small things.",
    ],
    future: [
      "{name}, worrying about their future is love pointed forward.",
      "You can't control what comes, {name}. You're preparing them anyway.",
      "{name}, the best preparation you can give is exactly what you're doing — being there.",
      "Their future has you in it, {name}. That's already an advantage.",
      "{name}, don't let a future you can't see steal the day you're in.",
    ],
    emotional_health: [
      "{name}, caring about how they feel — not just how they behave — changes everything.",
      "You're raising someone who'll know their own feelings, {name}. That's rare.",
      "{name}, a child who can talk to their parent has something most people never had.",
      "Their emotional safety starts with you noticing, {name}. You're noticing.",
      "{name}, you worry about their inner world. Most parents never think to.",
    ],
    safety: [
      "{name}, wanting them safe is the oldest instinct there is. It doesn't make you overprotective.",
      "You can't remove every risk, {name}. You can be the place they come back to.",
      "{name}, they feel safe because of choices you make without being thanked.",
      "The worry never fully goes, {name}. It just means you're paying attention.",
      "{name}, home is safe because you made it that way.",
    ],
  },

  // ── "What are you doing well?" ───────────────────────────────────────────
  parentStrength: {
    show_love: [
      "{name}, they know they're loved. Ask any child what matters and it's that.",
      "You said you show love well, {name}. That's the foundation everything else sits on.",
      "{name}, the affection you give freely is what they'll give their own children.",
      "Love expressed out loud is not a small thing, {name}. Many never get it.",
      "{name}, whatever else is hard, they are certain of you. That's enormous.",
    ],
    provide: [
      "{name}, providing is unglamorous, invisible and constant. You do it anyway.",
      "They have what they need because of you, {name}. They may never see the effort.",
      "{name}, the security you provide is felt long before it's understood.",
      "Keeping a family going is real work, {name}. You're doing it.",
      "{name}, providing is a daily act of love that nobody applauds.",
    ],
    protect: [
      "{name}, they sleep easily because you're standing between them and the world.",
      "You said you protect them well, {name}. That's the deepest job there is.",
      "{name}, safety is a feeling before it's a fact. You give them both.",
      "The things you shield them from, they'll never know about, {name}. That's the point.",
      "{name}, being their safe place is not a small role.",
    ],
    teach_values: [
      "{name}, you're raising who they'll be, not just how they behave today.",
      "Values are caught more than taught, {name}, and they're watching you closely.",
      "{name}, what you model at home becomes what they consider normal. Choose it, as you do.",
      "You're thinking about their character, {name}. That's long-term parenting.",
      "{name}, the standards you hold will outlive every argument about them.",
    ],
    present: [
      "{name}, presence is the rarest thing a child can be given now. You give it.",
      "You said you're present, {name}. That's what they'll remember — not the things.",
      "{name}, being there is most of it. You're there.",
      "Attention is the purest form of love, {name}, and you spend it on them.",
      "{name}, they'll remember you were in the room. Fully.",
    ],
    learning: [
      "{name}, calling learning your strength shows real self-awareness.",
      "You're growing alongside them, {name}. They get to watch that.",
      "{name}, a parent who keeps learning raises a child who keeps learning.",
      "Willingness to change is a strength most adults lose, {name}. You kept it.",
      "{name}, you're better at this than you were a year ago. That continues.",
    ],
  },

  // ── "What do you fear most?" ─────────────────────────────────────────────
  parentFear: {
    drift_away: [
      "{name}, the fear of losing closeness is usually strongest in the closest parents.",
      "Children pull away and come back, {name}. The coming back is the part that lasts.",
      "{name}, staying reachable matters more than staying close every day.",
      "They'll drift, {name}. They'll also return, and they'll know where to.",
      "{name}, the thread doesn't break just because it goes slack for a while.",
    ],
    fail_them: [
      "{name}, the fear of failing them is carried only by parents who won't.",
      "You'll get things wrong, {name}. That isn't failure — it's the job.",
      "{name}, they don't need you flawless. They need you honest and present.",
      "Failing them would look like not caring, {name}. Look at how much you care.",
      "{name}, this fear is a compass, not a verdict.",
    ],
    not_prepare: [
      "{name}, you're preparing them right now in ways you can't measure yet.",
      "No parent finishes the job feeling ready, {name}. They leave anyway, and they're fine.",
      "{name}, resilience is built by small ordinary days like the one you just had.",
      "You're giving them a base, {name}. They'll build the rest themselves.",
      "{name}, they'll be more ready than you think, because of you.",
    ],
    too_strict: [
      "{name}, worrying you're too strict is what stops a parent becoming so.",
      "Boundaries with warmth aren't strictness, {name}. They're structure.",
      "{name}, they'll understand the rules much later than you'd like. They will understand.",
      "You're checking yourself, {name}. Strict parents don't do that.",
      "{name}, firm and loving is a hard balance and you're actively holding it.",
    ],
    too_soft: [
      "{name}, worrying you're too soft usually means your instinct is kindness. That's not a flaw.",
      "Gentle parents raise secure children, {name}. Softness isn't weakness.",
      "{name}, you can be warm and still hold a line. You already do both.",
      "Being loved generously never harmed a child, {name}.",
      "{name}, the fact you're asking the question means you'll find the balance.",
    ],
    repeat_mistakes: [
      "{name}, fearing you'll repeat what was done to you is the exact reason you won't.",
      "You noticed the pattern, {name}. Noticing is where cycles break.",
      "{name}, doing it differently is exhausting and invisible. It's also working.",
      "The past doesn't get a vote here, {name}. You do.",
      "{name}, your children are getting a different childhood because you decided they would.",
    ],
  },

  // ── "What would you like to change in six months?" ───────────────────────
  hopeChange: {
    less_stress: [
      "{name}, you wanted a calmer home. Calm is built in small ordinary choices, and you're making them.",
      "Less stress isn't a destination, {name}. It's a few better days strung together.",
      "{name}, a calmer you is the fastest route to a calmer house.",
      "You asked for peace, {name}. It arrives quietly and in pieces.",
      "{name}, you're closer to it than the loud days suggest.",
    ],
    better_routines: [
      "{name}, you wanted better routines. Routines are just repeated decisions, and you keep making them.",
      "Every rhythm your family has, you built, {name}.",
      "{name}, structure takes weeks to feel natural. Keep going.",
      "You wanted order, {name}. Children settle into it faster than parents expect.",
      "{name}, the routine doesn't have to be perfect to work.",
    ],
    more_cooperation: [
      "{name}, you hoped for more cooperation. It comes slowly, then suddenly.",
      "They're learning to work with you, {name}, not against you. It just takes time.",
      "{name}, cooperation grows out of connection, and you're building that daily.",
      "You wanted fewer battles, {name}. Every calm one you handle teaches them something.",
      "{name}, they will meet you halfway. Often later than you'd like.",
    ],
    stronger_connection: [
      "{name}, you wanted to feel closer to them. Wanting it is most of how it happens.",
      "Connection is built in unremarkable moments, {name}. You've had some today.",
      "{name}, they want closeness with you too, even when they hide it.",
      "You asked for a stronger bond, {name}. It grows where attention goes.",
      "{name}, the closeness you want is already partly there.",
    ],
    clearer_structure: [
      "{name}, you wanted clarity. Children relax when they know what happens next — you're giving them that.",
      "Structure isn't rigidity, {name}. It's a shape they can trust.",
      "{name}, clear expectations are one of the kindest things you can offer.",
      "You wanted less guesswork at home, {name}. That's a fair thing to want.",
      "{name}, the clearer it gets, the calmer they get.",
    ],
    more_peace: [
      "{name}, you wanted peace at home. That's not too much to ask for.",
      "Peace isn't silence, {name}. It's the feeling that things are basically okay.",
      "{name}, a peaceful home is built, not found. You're building it.",
      "You asked for calm, {name}. Some of today probably was.",
      "{name}, the peace you want will arrive without announcing itself.",
    ],
  },

  // ── "What are you committing to?" ────────────────────────────────────────
  commitment: {
    better_parent: [
      "{name}, you committed to becoming a better parent. You already are — that's what commitment does.",
      "Better isn't a finish line, {name}. It's the direction you're facing.",
      "{name}, wanting to improve at this is itself a form of love.",
      "You made a promise to yourself, {name}. Your children are the beneficiaries.",
      "{name}, small improvements compound. Yours are.",
    ],
    peace_home: [
      "{name}, you committed to a peaceful home. That commitment is felt long before it's achieved.",
      "Peace at home starts with one person deciding, {name}. You decided.",
      "{name}, your children will grow up describing home as calm. That's your doing.",
      "You chose peace over winning, {name}. That's a hard, good choice.",
      "{name}, the atmosphere in your house is largely yours to set. You're setting it.",
    ],
    children_thrive: [
      "{name}, you committed to them thriving, not just coping. That's an ambitious kind of love.",
      "Thriving children usually have a parent who insisted on it, {name}.",
      "{name}, you're aiming higher than survival. They'll feel the difference.",
      "You want more for them than you had, {name}. That's how families change.",
      "{name}, they're growing up with someone in their corner. That's the whole thing.",
    ],
    structure_not_chaos: [
      "{name}, you chose structure over chaos. That's a daily decision and you keep making it.",
      "Order at home takes constant effort, {name}. Nobody sees it but everybody feels it.",
      "{name}, the calm you're building costs you something. It's worth it.",
      "You committed to less chaos, {name}. Every routine you hold is that promise kept.",
      "{name}, structure is love with a timetable.",
    ],
    love_clarity: [
      "{name}, you committed to loving them clearly. Children need love they can actually see.",
      "Clear love leaves no room for doubt, {name}. That's a gift.",
      "{name}, they'll never have to wonder where they stand with you.",
      "You chose to make it obvious, {name}. Many parents assume it's understood.",
      "{name}, saying it plainly is the kindest thing you can do.",
    ],
  },
};

/** Total variants available, used for sanity checks and tests. */
export function countAffirmations(): { options: number; messages: number } {
  let options = 0;
  let messages = 0;
  for (const field of Object.values(AFFIRMATIONS)) {
    for (const variants of Object.values(field)) {
      options += 1;
      messages += variants.length;
    }
  }
  return { options, messages };
}
