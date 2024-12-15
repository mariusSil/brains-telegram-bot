import TelegramBot from 'node-telegram-bot-api';

export class ContextService {
  private static instance: ContextService;
  private messages: TelegramBot.Message[] = [];
  private readonly maxMessages = 30;
  public botId: number = 0;

  private constructor() {}

  public static getInstance(): ContextService {
    if (!ContextService.instance) {
      ContextService.instance = new ContextService();
    }
    return ContextService.instance;
  }

  public addMessage(message: TelegramBot.Message): void {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift(); // Remove the oldest message
    }
  }

  public getLastMessages(count: number = this.maxMessages): TelegramBot.Message[] {
    return this.messages.slice(-Math.min(count, this.maxMessages));
  }

  public getMessagesByUser(
    userId: number,
    count: number = this.maxMessages,
  ): TelegramBot.Message[] {
    return this.messages
      .filter((msg) => msg.from?.id === userId)
      .slice(-Math.min(count, this.maxMessages));
  }

  public clearMessages(): void {
    this.messages = [];
  }

  public getMessagesCount(): number {
    return this.messages.length;
  }

  public isBotTooActive(): boolean {
    const lastMessages = this.getLastMessages(10);
    const botMessages = lastMessages.filter((msg) => msg.from?.id === this.botId);
    return botMessages.length >= 3;
  }
}

export default ContextService.getInstance();
