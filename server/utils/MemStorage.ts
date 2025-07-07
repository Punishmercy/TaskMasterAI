type Task = {
    id: number;
    userId: number;
    title: string;
    completed: boolean;
};

type Conversation = {
    id: number;
    userId: number;
    message: string;
    timestamp: number;
};

type Rating = {
    id: number;
    userId: number;
    accuracy: number;
    clarity: number;
    relevance: number;
    consistency: number;
};

export class MemStorage {
    private tasks = new Map<number, Task>();
    private conversations = new Map<number, Conversation>();
    private ratings = new Map<number, Rating>();
    private taskIdCounter = 1;
    private conversationIdCounter = 1;
    private ratingIdCounter = 1;

    async getTasksByUser(userId: number): Promise<Task[]> {
        return Array.from(this.tasks.values()).filter(task => task.userId === userId);
    }

    async createConversation(conversation: Omit<Conversation, "id">): Promise<Conversation> {
        const newConv: Conversation = { ...conversation, id: this.conversationIdCounter++ };
        this.conversations.set(newConv.id, newConv);
        return newConv;
    }

    async getConversationsByUser(userId: number): Promise<Conversation[]> {
        return Array.from(this.conversations.values()).filter(conv => conv.userId === userId);
    }

    async createRating(rating: Omit<Rating, "id">): Promise<Rating> {
        const newRating: Rating = { ...rating, id: this.ratingIdCounter++ };
        this.ratings.set(newRating.id, newRating);
        return newRating;
    }

    async updateRating(id: number, data: Partial<Rating>): Promise<Rating | null> {
        const rating = this.ratings.get(id);
        if (!rating) return null;
        const updated = { ...rating, ...data };
        this.ratings.set(id, updated);
        return updated;
    }

    async getRatingsByUser(userId: number): Promise<Rating[]> {
        return Array.from(this.ratings.values()).filter(rating => rating.userId === userId);
    }

    async getUserByUsername(username: string): Promise<{ id: number; username: string; password: string } | null> {
        // Este método es solo de ejemplo. Deberías integrarlo con usuarios reales.
        if (username === "admin") {
            return { id: 1, username: "admin", password: "admin" };
        }
        return null;
    }
}

export const storage = new MemStorage();
