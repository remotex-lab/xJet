/**
 * Imports
 */

import { AsyncQueueService } from '@services/async-queue.service';

/**
 * Tests
 */

describe('AsyncQueueService', () => {
    let queue: AsyncQueueService;

    beforeEach(() => {
        queue = new AsyncQueueService(2); // Create a new queue with concurrency of 2 for each test
    });

    test('should initialize with correct defaults', () => {
        expect(queue.size).toBe(0);
        expect(queue.running).toBe(0);
        expect(queue.isPaused).toBe(true);
    });

    test('should respect the concurrency limit', async() => {
        // Start the queue
        queue.start();

        // Create task tracking
        const executing: number[] = [];
        const completionOrder: number[] = [];

        // Helper function to create a task that resolves after delay
        const createTask = (id: number, delay: number) => async() => {
            executing.push(id);
            await new Promise(resolve => setTimeout(resolve, delay));
            executing.splice(executing.indexOf(id), 1);
            completionOrder.push(id);

            return id;
        };

        // Enqueue 4 tasks
        const task1 = queue.enqueue(createTask(1, 80));
        const task2 = queue.enqueue(createTask(2, 10));
        const task3 = queue.enqueue(createTask(3, 30));
        const task4 = queue.enqueue(createTask(4, 10));

        // Check queue size (should be 2, as 2 tasks are running and 2 are queued)
        expect(queue.size).toBe(2);
        expect(queue.running).toBe(2);

        // Verify only 2 tasks are running concurrently
        expect(executing.length).toBeLessThanOrEqual(2);

        // Wait for all tasks to complete
        const results = await Promise.all([ task1, task2, task3, task4 ]);

        // Check all tasks completed with correct values
        expect(results).toEqual([ 1, 2, 3, 4 ]);

        // Check completion order - tasks 2 and 4 should finish before 1 and 3
        // due to their shorter timeouts
        expect(completionOrder).toEqual([ 2, 3, 4, 1 ]);

        // Queue should be empty and no tasks running
        expect(queue.size).toBe(0);
        expect(queue.running).toBe(0);
    });

    test('should stop and start queue processing', async() => {
        // Create a set of delayed tasks
        const results: number[] = [];
        const createTask = (id: number) => async() => {
            results.push(id);

            return id;
        };

        // Start with queue paused (default)
        expect(queue.isPaused).toBe(true);

        // Enqueue tasks while paused
        queue.enqueue(createTask(1));
        queue.enqueue(createTask(2));

        // Tasks should be in queue but not running
        expect(queue.size).toBe(2);
        expect(queue.running).toBe(0);

        // No results yet
        expect(results).toEqual([]);

        // Start the queue
        queue.start();

        // Wait for tasks to process
        await new Promise(resolve => setTimeout(resolve, 10));

        // Results should now contain completed tasks
        expect(results).toEqual([ 1, 2 ]);

        // Queue should be empty
        expect(queue.size).toBe(0);
        expect(queue.running).toBe(0);

        // Pause the queue
        queue.stop();

        // Add more tasks
        queue.enqueue(createTask(3));
        queue.enqueue(createTask(4));

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 10));

        // Tasks should still be in queue since it's paused
        expect(queue.size).toBe(2);
        expect(results).toEqual([ 1, 2 ]); // No new results

        // Start again
        queue.start();

        // Wait for tasks to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        // All tasks should be processed now
        expect(results).toEqual([ 1, 2, 3, 4 ]);
        expect(queue.size).toBe(0);
    });

    test('should clear the queue', async() => {
        // Create tasks that we'll clear
        const resolved: number[] = [];
        const rejections: Error[] = [];

        const createTask = (id: number) => async() => {
            resolved.push(id);

            return id;
        };

        // Add tasks to queue (paused)
        queue.enqueue(createTask(1)).catch(err => rejections.push(err));
        queue.enqueue(createTask(2)).catch(err => rejections.push(err));
        queue.enqueue(createTask(3)).catch(err => rejections.push(err));

        // Verify tasks are queued
        expect(queue.size).toBe(3);

        // Clear the queue
        const removed = queue.clear();

        // Check return value reports correct number removed
        expect(removed).toBe(3);

        // Queue should be empty
        expect(queue.size).toBe(0);

        // Start the queue
        queue.start();

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 10));

        // No tasks should have executed
        expect(resolved).toEqual([]);

        // None of the promises should have resolved or rejected yet
        // They should be orphaned now that the queue has been cleared
    });

    test('should handle errors in tasks', async() => {
        queue.start();

        // Create a task that will fail
        const errorTask = async() => {
            throw new Error('Task failed');
        };

        // Enqueue the failing task and a successful task
        const failingPromise = queue.enqueue(errorTask);
        const successPromise = queue.enqueue(async() => 'success');

        // The error task should reject
        await expect(failingPromise).rejects.toThrow('Task failed');

        // The success task should still complete
        await expect(successPromise).resolves.toBe('success');

        // Queue should continue processing after errors
        expect(queue.size).toBe(0);
        expect(queue.running).toBe(0);
    });

    test('should handle multiple start calls gracefully', () => {
        expect(queue.isPaused).toBe(true);

        // First start should unpause
        queue.start();
        expect(queue.isPaused).toBe(false);

        // Second start should have no effect
        queue.start();
        expect(queue.isPaused).toBe(false);
    });

    test('should use minimum concurrency of 1', () => {
        // Test with invalid concurrency values
        const queueZero = new AsyncQueueService(0);
        const queueNegative = new AsyncQueueService(-5);

        // Both should default to concurrency of 1
        expect(queueZero.isPaused).toBe(true);
        expect(queueNegative.isPaused).toBe(true);

        // We can't directly test the concurrency value as it's private,
        // but we can test the behavior
        queueZero.start();
        queueNegative.start();

        const results: number[] = [];

        queueZero.enqueue(async() => {
            results.push(1);
            // Delaying to ensure second task isn't executed immediately
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        queueZero.enqueue(async() => {
            results.push(2);
        });

        // At this point, only one task should be running
        expect(queueZero.running).toBe(1);

        // Let tasks complete
        return new Promise<void>(resolve => {
            setTimeout(() => {
                expect(results).toEqual([ 1, 2 ]);
                resolve();
            }, 30);
        });
    });
});
