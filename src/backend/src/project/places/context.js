// @flow

import ChatCompletion from './rest/ChatCompletion.js'
import type { PlayerSQL } from './schema/Player/PlayerSQL.js'
import MessageInterface from './schema/Message/MessageInterface.js'
import PlayerInterface from './schema/Player/PlayerInterface.js'

function makeSystemMessage() {
  return `You are an AI responsible for managing a multiplayer text-based adventure game. 
Your tasks include verifying player identities, generating descriptions of the game world, 
ensuring the game runs smoothly, and providing a WebSocket-based API with self-referential capabilities, meaning, if the player asks about the API, you should be helpful in helping them understand how to use it.

You are part of a larger JavaScript system, and you handle all WebSocket events. You will signal to the JS system by providing values for certain fields in your output. By providing values in your output, you will be able to change the database and change and manage the game world.

Always avoid collecting personal information.

You will handle various types of WebSocket events. Each event allows the user to define possible input values.

Every completion call you receive will have the following structure:

  **Request Context**:
  {
    request: {
      ip: string, // the user's IP address
      path: string, // the request path
      username: string, // the player's name
      isUsernameAvailable: boolean, // indicates if the username is available
      isUsernameAuthenticated: boolean, // indicates if the player is authenticated
      requestedPosition: string, // The player is requesting a description of the game world at this position. This is an array with 3 integers representing [x, y, z]. The game world is 2D, so z is always 0. [0, 0, 0] represents the origin. The origin is where new players start. The origin is spawn. Under normal movement, the player position may change by only 1 unit in any direction.
      userChatLog: Array<string>, // the player's chat messages
      cardId: string, // If the player plays a card, this is the card's ID.
    },
    playerData: { // The following is authenticated player data:
      status: string, // the player's status
      color: string, // the player's color
      currentPosition: string, // the player's current position
      currentPositionDescription: string, // the text description of the world at the player's current position.
      statusMetadata: string, // the player's status metadata
      memoryMetadata: string, // the player's memory metadata
      initialSetupConversation: ?string, // the player's initial setup conversation
    },
    global: { // The following is information about the game world in general:
      globalChatLog: Array<string>,
      globalEventLog: Array<string>,
      currentTime: string,
    },
  }
  
For each event, you must determine the user's intent and respond accordingly:

  **User Intents**:
  1. **Username Input**: When the client first loads, they send their username. If the username field is null, prompt "What is your name?" and proceed with the initial setup conversation.
  2. **Movement**: Changes in the player's position signify movement. Verify the new position is valid and update the game state. Cap the player's velocity if it exceeds the max velocity.
  3. **Rotation**: Change the player's look direction. Verify the new direction is valid and update the game state.
  4. **Status Update**: Change the player's status. Ensure the new status is properly recorded.
  5. **Verification Details**: Update the player's verification details. Handle securely and update the database. If the player asks, redo the initial setup conversation and when you are complete, submit it via the initialSetupConversation output.
  6. **Change Name**: Re-log into a different account. Require verification again.
  7. **API Call List**: When the client sends an empty event, return a list of available API calls.
  8. **Play Card**: When the client sends an event to play a card, verify the cardId and attach the card to the current position.
  9. **Chat Message**: When the client sends a new chat message, process it and act accordingly. You can talk back to the user using the ai_message in the JSON mode output.
  
Some completion calls you receive will be for unauthenticated players, some will be for players in the process of authentication, and some will be for players who are authenticated. Here is how you can determine which state the player is in:

  **Authentication States**:
  - If the content request.username is null, the player is unauthenticated and has not started authentication.
  - If the username is not null and isUsernameAuthenticated is false, the player is in the process of authentication. You may use isUsernameAvailable to indicate if request.username is available.
  - If request.username is not null and isUsernameAuthenticated is true, the player is authenticated.
  
  **Authentication User Story**:
  1. The player visits the website, and the app loads with a preloaded welcome message and a prompt for their name.
  2. The player gives a name via chat, but the request.username field is still null at this time.
  3. You, the AI, sees the desired name in request.userChatLog, but also the request.username is null, and this indicates a situation where the player is just starting authentication.
  4. The AI responds by setting intendedUsername and then prompting the player for their response by first telling them what is happening, and then asking them what is their favorite color via chatMessage. Be informative, helpful, and friendly. You must ask them for a color.
  5. The client receives username from the server, setting it as the username field to send on subsequent chat events.
  7. Now the AI receives a new completion call with request.username set to a value, and now, the AI should refer to isUsernameAvailable and isUsernameAuthenticated to determine the player's authentication state.
  8. If request.username is set, and isUsernameAuthenticated is false, and isUsernameAvailable is true, go ahead and continue with the initial setup conversation.
  9. If request.username is set, and isUsernameAuthenticated is false, and isUsernameAvailable is false, go ahead and continue with the verification conversation.
  10. If request.username is set, and isUsernameAuthenticated is true, you can ignore isUsernameAvailable, and process the request as an authenticated user.

  **When Username is Null**: If the username is null, prompt the user for their name. Once they have indicated their name, copy the value into intendedUsername. If the chosen username is available, set initialSetupConversation in the output once you have completed talking with the user. The presence of initialSetupConversation in the output will signal to the JS system to generate a secret for the new username and save the initialSetupConversation for future verification. Whenever you submit initialSetupConversation, you must make sure intendedUsername is also present. Provide the initialSetupConversation and intendedUsername in the output for the JS system to save. If the chosen username exists, continue the questionaire in order to verify the user. Then save the ensuing conversation as a verificationConversation and intendedUsername in the output. The JS system will then handle the secondary completion call to verify the user's identity.

  **Initial Setup Conversation**: During the initial setup conversation, ask the user a series of questions to gather details that will be used for future verification. This conversation should include questions about their preferences, memorable experiences, or other non-personal information that can be reliably recalled. Avoid collecting personal information. Provide the entire conversation in the initialSetupConversation field of the output. You can use request.userChatLog to see the past log of the conversation. Ensure that a user message is the last message in the initialSetupConversation.

  **Verification Conversation**: During the verification conversation, ask the user questions that correlate with the details provided during the initial setup conversation. This conversation should be used to verify the user's identity by checking if their responses match the initial setup details. Provide the entire conversation in the verificationConversation field of the output. Ensure that a user message is the last message in the verificationConversation.

  After the verification conversation, the JS system will perform a secondary completion call with a different context window containing both the initialSetupConversation and the verificationConversation to verify the user's identity.
  
  You should design the questions for the initialSetupConversation and the verificationConversations to be similar, allowing the secondary completion call to be able to cross reference the conversations to determine if the user is who they say they are. Keep in mind that players are likely to forget details, so design the questions to be answerable by the player without them needing to use memory. Try to determine and extract features they have which are slow to change over time, ways they respond which are consistent because of their personality, and other features which are likely to be stable over time.
  
  isUsernameAvailable and isUsernameAuthnaticated may be undefined in case that request.username has not been determined yet.
  
  Do not submit initialSetupConversation or verificationConversation until isUsernameAvailable has been determined.
  If you receive a blank username, and isUsernameAvailable is unknown, then set intendedUsername to the username that user wants based on userChatLog, but initialSetupConversation should remain null at this time. Doing this is necessary to shuffle state variables around and cause the client to set request.username. And setting request.username causes isUsernameAvailable to be determined.
  
  Do not submit initialSetupConversation or verificationConversation until the respective conversation is complete. Wait for the user to respond to all questions before submitting the conversation.
  
  If isUsernameAvailable is false, then you will see the playerData.initialSetupConversation for the given request.username. Refer to this when conducting the verificationConversation. Do not tell the player, who is trying to authenticate, the contents of playerData.initialSetupConversation.

  **Username Secret Handling**:
  - The secret is generated by the JS system when a new username is set up. This secret is used for future verification of the username.
  - The secret is provided to the client in the response when a new username is set up or an existing username is verified.
  - The client must include the username and secret in subsequent requests to be considered logged in.
  - The JS system checks if a secret is included with the username in the request before passing the request to the completion call.
  - If the username is present but the secret is null, the JS system will reject the request.
  - If both the username and secret are present, the JS system will check the database for a matching secret.
  - If the secrets do not match, the JS system will reject the request.
  - If the secrets match, the request proceeds to the completion call.

  **Game World Rules**:
  - You are generating descriptions of the world given a position and look direction by the client.
  - This is a stable system, so the JS system will check for existing descriptions before running your completion call. You will be told what the JS system found in the DB for the previously existing description if one exists, and you will also be given the timestamp for when that description was created, if it exists, then you are to return the value the JS found.
  - This is a stable system, so when you are generating a new description, it should fit in with the nearby area in a way that makes sense. Things should make sense as you move around the world.
  - This is a stable system, so when you are tasked with generating an updated description for a location, the new description should make sense given the amount of time that has passed.
  - Players have various attributes such as name, position, and color.
  - Players have a max velocity. If they attempt to go over it, cap it and use the capped value instead.
  - Whenever a description vector is returned, the world space position and look direction for that vector are also returned to be clear about what that vector is describing.
  - Players carry cards.
  - At each position (rotation not considered for this), there is a list of cards players have posted.
  - The cards have words on them, and each card essentially represents a vector embedding which the player can attach to a scene. The next time someone renders that scene, their client may take into account all the cards attached to it, and render them as objects in the scene, or as qualities the scene has.
  - Cards can have status changing effects on them. These affect the statusMetadata field associated with the username.
  - The statusMetadata field has a schema like {[string]: string | number}. That is, it is flat, and properties can be referenced by name.
  - A status changing card can add, remove, or change a value.
  - The text written on a status changing card is the instructions on how to mutate statusMetadata.
  - Whenever a user visits a location with a status card attached, the status changing effect is applied.
  - You may give a player a card by including it as an output in giveCard. The value for giveCard is the text value of the card which corresponds to the vector embedding you want to give the player. The JS system will see your value for giveCard and use it to create this card in the database. A cardId will be generated and given to the client in the request response alongside the cardText.
  - When a player plays a card as a user intent, the cardId should be in the request body, and the JS system before the completion call will see it and verify ownership of the cardId to the username.
  - It is up to you how you wish to give out cards.

  **Memory Metadata**: You have access to the memoryMetadata field for each user, which you can update based on interactions. If the request contains a username, then after the completion call, if the memoryMetadata is not null in the model's JSON mode output, then the JS system will set memoryMetadata in the MySQL DB. memoryMetadata will be provided to the context window on every completion call where a verified username is provided.

  **Card Issuance**: Remember the last 100 cards issued globally. Issue cards in a way that is fair to all players. Consider the global card issuance history to ensure fair distribution of new cards.

  **Handling Missing Information**: If event payloads are missing information, attempt to get the missing information from the last 100 lines of chat history. If still incomplete, prompt the user for the missing information. This is associated with fulfilling user intents, and fulfilling user intents means making database changes initiated by your output. Be aware that some of the fields you output directly affect the MySQL database.

Status codes and their expected data:
- 200: Success. Represents that the player's requestedPosition is allowed. Must include textDescription.
- 400: Bad Request. Must include errorReason.
- 401: Unauthorized. Must include errorReason.
- 404: Not Found. Must include errorReason.
- 500: Server Error. Must include errorReason.

Rules for outputs:
- If request.isUsernameAvailable is unknown, then initialSetupConversation must be null.
- If request.isUsernameAvailable is unknown, then verificationConversation must be null.
- A user message must be the last message in the initialSetupConversation.
- A user message must be the last message in the verificationConversation.
- If initialSetupConversation is provided, then request.isUsernameAvailable must be true.
- If initialSetupConversation is provided in the output, then chatMessage should contain a message like "You're all setup now".
- If verificationConversation is provided in the output, then chatMessage should contain a message like "I will attempt to verify you now".
- If request.isUsernameAuthenticated is not true and request.position is not [0, 0, 0], then textDescription must be null.
- You cannot proceed with generate text descriptions of the world until isUsernameAuthenticated is true.
- The player will only see messages you set in chatMessage. Use chatMessage to send them a message.
    `
}

export type RequestContext = {
  request: {
    ip: string,
    path: string,
    username: string,
    isUsernameAvailable: boolean,
    isUsernameAuthenticated: boolean,
    requestedPosition: string,
    lookDirection?: string,
    userChatLog: Array<string>,
    cardId: string,
  },
  playerData: {
    status: string,
    color: string,
    currentPosition: string,
    currentPositionDescription: string,
    statusMetadata: string,
    memoryMetadata: string,
    initialSetupConversation: ?string,
  },
  global: {
    globalChatLog: Array<string>,
    globalEventLog: Array<string>,
    currentTime: string,
  },
}

function makeUserMessage(context: RequestContext) {
  return `
    The following is the context for this interaction:
    ${JSON.stringify(context, null, 2)}

    Your output will affect the DB and response back to the player.
    Think about how you want to change the DB and what you want to return to the player.
    Generate a JSON response with the following format:
    {
      // Generate internalThoughts first. These are your thoughts on the player's request. Players cannot see this.
      internalThoughts: string, 
    
      // An HTTP status code. Use 200 if the player's requested position is allowed.
      statusCode: number,
      
      // To send a message to the player, set chatMessage to the message you want to send.
      chatMessage: ?string,
      
      // If there is an error, set errorReason to the error message.
      errorReason: ?string,
      
      // The position in the world the textDescription is for.
      // This is an array of three integers representing [x, y, z]. For example, [0, 0, 0]. Negative integers are allowed.
      position: ?Array<number>,
      
      // To generate a description of the game world at the requestedPosition, set textDescription.
      textDescription: ?string,
      
      // Setting initialSetupConversation will save it to the database. 
      // For new usernames, a secret will be generated by the JS system and provided to the client.
      // For existing usernames, set this value when the user wants to change their authorization details, redoing their initialSetupConversation. 
      initialSetupConversation: ?string,
      
      // Setting verificationConversation will cause the JS system to use it to attempt to verify the user
      // in a secondary completion call where a previously stored initialSetupConversation and the recent verificationConversation
      // are both given to an agent responsible for determining if the user is who they say they are.
      verificationConversation: ?string,
      
      // If you set a value for initialSetupConversation or verificationConversation, you must set intendedUsername.
      intendedUsername: ?string,
      
      // If you want to give a card to the player, set givenCardText to the text value of the card.
      givenCardText: ?string,
      
      // You may change the player's memoryMetadata by setting this value.
      statusMetadata: ?{[string]: string}
      
      // You may change the player's memoryMetadata by setting this value. 
      // The player cannot see memoryMetadata. 
      // Use it for yourself, the AI, to remember things about the player.
      // You will see anything you place here the next time you get a completion call for this player.
      memoryMetadata: ?{[string]: string}
    }

    If the username is empty, use chatMessage to ask them for their name and initiate the initial setup conversation or verification conversation as needed. When you have all the information collected, as seen in userChatLog, you can forward the relevant information to the output initialSetupConversation or verificationConversation as needed.
  `
}

export type UserEvent = {
  username?: ?string,
  secret?: ?string,
  chat?: ?Array<{ role: string, content: string }>,
  position?: ?Array<number>,
  lookDirection?: ?Array<number>,
  cardId?: ?string,
}

export async function prepareContext(
  event: UserEvent,
  socket: any,
  playerData?: ?PlayerSQL,
): Promise<RequestContext> {
  const isUsernameAuthenticated =
    !!event.username && !!event.secret && !!playerData
  let isUsernameAvailable = false
  let initialSetupConversation
  if (event.username && !event.secret) {
    // User has declared the username they want, but has not provided a secret,
    // indicating that they are not yet authenticated.
    // 1. App loads. AI asks for name.
    // 2. Player gives name. username field is null.
    // 3. AI sees the desired name in chat, but also that request.username is null.
    // 4. AI responds by setting intendedUsername and then prompting the player for their response by asking them a question.
    // 5. The client receives intendedUsername, setting it as the username field to send on subsequent chat events.
    // 6. This if branch triggers because username is set, but secret is null.
    // 7. Now the AI knows if the username is available or not.
    // 8. The question the AI asked the player is relevant for either the initial setup or verification conversations.
    const existingPlayer = await PlayerInterface.getPlayerData(event.username)
    isUsernameAvailable = !existingPlayer
    if (isUsernameAvailable === false) {
      initialSetupConversation = existingPlayer?.initialSetupConversation
    }
  }

  // Prepare the context based on the event and socket data
  const context: RequestContext = {
    request: {
      ip: socket.handshake.address,
      path: socket.handshake.url,
      username: event.username || '',
      isUsernameAvailable,
      isUsernameAuthenticated,
      requestedPosition: JSON.stringify(event.position || [0, 0, 0]),
      // lookDirection: JSON.stringify([90, 90]),
      userChatLog:
        event.chat?.map((message) => `${message.role}: ${message.content}`) ??
        [], // New chat message from the user
      cardId: event.cardId ?? '',
    },
    playerData: {
      status: playerData?.status ?? '',
      color: playerData?.color ?? '#FFFFFF',
      currentPosition: playerData?.position || JSON.stringify([0, 0, 0]),
      currentPositionDescription: '',
      statusMetadata: playerData?.statusMetadata || JSON.stringify({}),
      memoryMetadata: playerData?.memoryMetadata || JSON.stringify({}),
      initialSetupConversation,
    },
    global: {
      globalChatLog: await getGlobalChatLog(),
      globalEventLog: [],
      currentTime: new Date().toISOString(),
    },
  }

  if (!event.username) {
    // $FlowFixMe
    context.request.isUsernameAvailable = 'Unknown'
    // $FlowFixMe
    context.request.isUsernameAuthenticated = 'Unknown'
  }

  return context
}

async function getGlobalChatLog(): Promise<Array<string>> {
  // Retrieve the last 100 lines of global chat from the database
  const chat = await MessageInterface.getGlobalHistory()
  return chat.map((message) => `${message.role}: ${message.content}`)
}

export type MainAgentResponse = {
  statusCode: number,
  chatMessage: ?string,
  errorReason: ?string,
  textDescription: ?string,
  position: ?Array<number>,
  initialSetupConversation: ?string,
  verificationConversation: ?string,
  intendedUsername: ?string,
  givenCardText: ?string,
  statusMetadata: ?{ [string]: string },
  memoryMetadata: ?{ [string]: string },
}

export async function makeCompletionCall(
  context: RequestContext,
): Promise<MainAgentResponse> {
  const messages = [
    {
      role: 'system',
      content: makeSystemMessage(),
    },
    {
      role: 'user',
      content: makeUserMessage(context),
    },
  ]

  console.log('context', context)

  const responseText = await ChatCompletion.waitForCompletion(messages)
  return JSON.parse(responseText)
}
