import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER  } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';

@Injectable()
export class TempUserStoreService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

async setUser(userId: string, userData: any) {
    const key = "temp-user:" + userId;
    const value = JSON.stringify(userData);
    await this.cacheManager.set(key, value);

    const roomUsersKey = `room:${userData.roomId}:users`;
    const existingUsers: string[] = (await this.cacheManager.get(roomUsersKey)) || [];

    if (!existingUsers.includes(userId)) {
        existingUsers.push(userId);
        await this.cacheManager.set(roomUsersKey, existingUsers);
        
        const userRoomKey = `user:${userId}:room`;
        await this.cacheManager.set(userRoomKey, userData.roomId);
    }
}

    async getUser(userId: string) {
        const key = "temp-user:" + userId;
        const value = await this.cacheManager.get(key);
        

        if (value) {
            return JSON.parse(value as string);
        }
        return null;
    }

async deleteUser(userId: string) {
    const userRoomKey = `user:${userId}:room`;
    const roomId = await this.cacheManager.get(userRoomKey);
    
    const userKey = "temp-user:" + userId;
    await this.cacheManager.del(userKey);
    
    if (roomId) {
        const roomUsersKey = `room:${roomId}:users`;
        const existingUsers: string[] = (await this.cacheManager.get(roomUsersKey)) || [];
        const updatedUsers = existingUsers.filter(id => id !== userId);
        
        if (updatedUsers.length > 0) {
            await this.cacheManager.set(roomUsersKey, updatedUsers);
        } else {
            await this.cacheManager.del(roomUsersKey);
        }
        
        await this.cacheManager.del(userRoomKey);
    }

    
    return true;
}

async getRoomUsers(roomId: string) {
    const roomUsersKey = `room:${roomId}:users`;
    const userIds: string[] = (await this.cacheManager.get(roomUsersKey)) || [];

    const usersData = await Promise.all(
        userIds.map(async (userId) => {
            const userData = await this.getUser(userId);
            return userData ? { userId, ...userData } : null;
        })
    );
    
    return usersData.filter(user => user !== null);
}

async getRoomUserCount(roomId: string) {
    const roomUsersKey = `room:${roomId}:users`;
    const userIds: string[] = (await this.cacheManager.get(roomUsersKey)) || [];
    return userIds.length;
}
}
