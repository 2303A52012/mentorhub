import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

async function seedTrainerAndCalendar() {
  console.log('🌱 Seeding Trainers, Official Training Calendar, and Company POTDs...');

  // 1. Fetch existing batches
  const batches = await prisma.batch.findMany({
    orderBy: { name: 'asc' }
  });

  if (batches.length === 0) {
    console.error('❌ No batches found in database. Please run batch seed first.');
    process.exit(1);
  }

  const batchMap = {};
  batches.forEach((b) => {
    batchMap[b.name] = b.id;
  });

  console.log(`Found ${batches.length} cohorts:`, Object.keys(batchMap).join(', '));

  // 2. Create or ensure Default Trainers
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const trainersData = [
    {
      name: 'Prof. Arjun Verma',
      email: 'trainer.dsa@sru.edu.in',
      designation: 'Lead DSA & Competitive Programming Trainer',
      bio: 'Ex-Amazon SDE II, ICPC Regionalist. Specializes in Advanced Trees, Graph Algorithms, and Dynamic Programming.',
      batchNames: ['G6-B1', 'G6-B2']
    },
    {
      name: 'Dr. Meera Nambiar',
      email: 'trainer.system@sru.edu.in',
      designation: 'Corporate Technical Trainer & System Architect',
      bio: 'Former Tech Lead at Cisco. Expert in Distributed Systems, System Design, and Low-Level Concurrency.',
      batchNames: ['G6-B3', 'G6-B4']
    }
  ];

  const createdTrainers = [];

  for (const tData of trainersData) {
    let user = await prisma.user.findFirst({
      where: { email: { equals: tData.email, mode: 'insensitive' } }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: tData.name,
          email: tData.email.toLowerCase(),
          passwordHash,
          role: 'TRAINER',
          accountStatus: 'ACTIVE',
          mustChangePassword: false,
          trainerProfile: {
            create: {
              designation: tData.designation,
              bio: tData.bio
            }
          }
        }
      });
      console.log(`✅ Created Trainer: ${user.name} (${user.email})`);
    } else {
      console.log(`ℹ️ Trainer already exists: ${user.name} (${user.email})`);
    }

    // Link trainer to batches
    for (const bName of tData.batchNames) {
      const bId = batchMap[bName];
      if (bId) {
        await prisma.trainerBatch.upsert({
          where: { trainerId_batchId: { trainerId: user.id, batchId: bId } },
          create: { trainerId: user.id, batchId: bId, isPrimary: bName === tData.batchNames[0] },
          update: {}
        });
      }
    }

    createdTrainers.push(user);
  }

  const primaryTrainer = createdTrainers[0];

  // 3. Official Training Calendar Dates (Sep, Oct, Nov 2026)
  const officialSchedule = [
    // September 2026
    {
      date: new Date('2026-09-01T09:30:00Z'),
      topics: ['Time & Space Complexity Analysis', 'Recursion Fundamentals', 'Master Theorem & Recurrence Relations'],
      notes: 'Covered Big-O, Big-Theta, Big-Omega, recurrence tree method, and stack memory bounds in recursion.'
    },
    {
      date: new Date('2026-09-04T09:30:00Z'),
      topics: ['Arrays & Strings Mastery', 'Two Pointers Technique', 'Sliding Window Optimization'],
      notes: 'Practiced 3-Sum, Container With Most Water, Minimum Window Substring, and Longest Substring Without Repeating Characters.'
    },
    {
      date: new Date('2026-09-12T09:30:00Z'),
      topics: ['Binary Search Variations', 'Search in Rotated Sorted Array', 'Binary Search on Answer Space'],
      notes: 'Deep dive into lower_bound/upper_bound logic, Koko Eating Bananas, Capacity To Ship Packages Within D Days.'
    },
    {
      date: new Date('2026-09-19T09:30:00Z'),
      topics: ['Linked Lists Architecture', 'Fast & Slow Pointers Pattern', 'LRU Cache Design'],
      notes: 'Floyd Cycle Finding algorithm, Palindrome Linked List, Reverse Nodes in k-Group, and Doubly-Linked-List LRU Cache.'
    },

    // October 2026
    {
      date: new Date('2026-10-03T09:30:00Z'),
      topics: ['Stacks & Monotonic Stack Patterns', 'Next Greater Element', 'Largest Rectangle in Histogram'],
      notes: 'Monotonic increasing/decreasing stack paradigm, Daily Temperatures, Trapping Rain Water using stack.'
    },
    {
      date: new Date('2026-10-07T09:30:00Z'),
      topics: ['Queues, Circular Queues & Deque', 'Sliding Window Maximum', 'BFS Queue Foundations'],
      notes: 'Monotonic Deque design, Rotting Oranges, Shortest Path in Binary Matrix.'
    },
    {
      date: new Date('2026-10-10T09:30:00Z'),
      topics: ['Binary Trees: Core Traversals', 'Lowest Common Ancestor (LCA)', 'Binary Tree Maximum Path Sum'],
      notes: 'Euler tour, Morris Inorder Traversal (O(1) space), Diameter of Binary Tree, and subtree problem solving.'
    },
    {
      date: new Date('2026-10-17T09:30:00Z'),
      topics: ['Binary Search Trees (BST)', 'Inorder Successor/Predecessor', 'BST Validation & Construction'],
      notes: 'Validate BST, Kth Smallest Element in BST, Construct BST from Preorder, Recover BST with two swapped nodes.'
    },
    {
      date: new Date('2026-10-23T09:30:00Z'),
      topics: ['Heaps & Priority Queues', 'Top K Frequent Elements', 'Find Median from Data Stream'],
      notes: 'Min-Heap/Max-Heap dual balancing, Merge k Sorted Lists, Task Scheduler.'
    },
    {
      date: new Date('2026-10-24T09:30:00Z'),
      topics: ['Greedy Algorithms', 'Interval Scheduling & Merging', 'Gas Station & Jump Game'],
      notes: 'Non-overlapping Intervals, Minimum Number of Arrows to Burst Balloons, Huffman Coding fundamentals.'
    },
    {
      date: new Date('2026-10-31T09:30:00Z'),
      topics: ['Dynamic Programming 1: 1D DP', 'Memoization vs Tabulation', 'Frog Jump & House Robber'],
      notes: 'State identification, transition relations, base cases, and space optimization from O(N) to O(1).'
    },

    // November 2026
    {
      date: new Date('2026-11-05T09:30:00Z'),
      topics: ['Dynamic Programming 2: 2D Grid DP', '0/1 Knapsack Variants', 'Coin Change & Partition Equal Subset'],
      notes: 'Grid paths with obstacles, Target Sum, Unbounded Knapsack, Rod Cutting problem.'
    },
    {
      date: new Date('2026-11-14T09:30:00Z'),
      topics: ['Dynamic Programming on Strings', 'Longest Common Subsequence (LCS)', 'Edit Distance & Wildcard Matching'],
      notes: 'DP matrix construction, back-tracing optimal string alignment, Palindromic Partitioning II.'
    },
    {
      date: new Date('2026-11-21T09:30:00Z'),
      topics: ['Graphs 1: Graph Representation', 'DFS & BFS Algorithms', 'Topological Sort & Kahn’s Algorithm'],
      notes: 'Adjacency list with weighted edges, Course Schedule I & II, Cycle detection in directed/undirected graphs.'
    },
    {
      date: new Date('2026-11-22T09:30:00Z'),
      topics: ['Graphs 2: Shortest Path Algorithms', 'Dijkstra & Bellman-Ford', 'Disjoint Set Union (DSU) & Kruskal’s MST'],
      notes: 'Network Delay Time, Cheapest Flights Within K Stops, Number of Islands II using Path Compression + Union by Rank.'
    }
  ];

  console.log(`Seeding official training schedule across ${batches.length} cohorts...`);
  let sessionCount = 0;

  for (const b of batches) {
    for (const session of officialSchedule) {
      // Check if session on this date for this batch already exists
      const existing = await prisma.trainingSession.findFirst({
        where: {
          batchId: b.id,
          date: session.date
        }
      });

      if (!existing) {
        await prisma.trainingSession.create({
          data: {
            batchId: b.id,
            trainerId: primaryTrainer.id,
            date: session.date,
            topicsTaught: session.topics,
            notes: session.notes
          }
        });
        sessionCount++;
      }
    }
  }

  console.log(`✅ Seeded ${sessionCount} training calendar sessions.`);

  // 4. Seed Company-Tagged Daily Problems (POTD)
  const potdProblems = [
    {
      title: 'Amazon OA: Substring with At Most K Distinct Characters',
      company: 'Amazon',
      difficulty: 'MEDIUM',
      platform: 'LEETCODE',
      link: 'https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/',
      description: 'Given a string s and an integer k, return the length of the longest substring of s that contains at most k distinct characters.',
      tags: ['Sliding Window', 'Hash Table', 'Amazon OA 2026']
    },
    {
      title: 'Google Technical Round: Trapping Rain Water II',
      company: 'Google',
      difficulty: 'HARD',
      platform: 'LEETCODE',
      link: 'https://leetcode.com/problems/trapping-rain-water-ii/',
      description: 'Given an m x n integer matrix heightMap representing the height of each unit cell in a 2D elevation map, return the volume of water it can trap after raining.',
      tags: ['Priority Queue', 'BFS', 'Matrix', 'Google']
    },
    {
      title: 'Microsoft SDE: Course Schedule II',
      company: 'Microsoft',
      difficulty: 'MEDIUM',
      platform: 'LEETCODE',
      link: 'https://leetcode.com/problems/course-schedule-ii/',
      description: 'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. Return the ordering of courses you should take to finish all courses.',
      tags: ['Topological Sort', 'Graph', 'BFS', 'Microsoft']
    },
    {
      title: 'Atlassian OA: LRU Cache Implementation',
      company: 'Atlassian',
      difficulty: 'MEDIUM',
      platform: 'LEETCODE',
      link: 'https://leetcode.com/problems/lru-cache/',
      description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) time complexity for get and put operations.',
      tags: ['Doubly Linked List', 'Hash Table', 'Design', 'Atlassian']
    },
    {
      title: 'Uber Driver Match: Minimum Cost to Connect All Points',
      company: 'Uber',
      difficulty: 'MEDIUM',
      platform: 'LEETCODE',
      link: 'https://leetcode.com/problems/min-cost-to-connect-all-points/',
      description: 'You are given an array points representing integer coordinates of some points on a 2D-plane. Return the minimum cost to make all points connected.',
      tags: ['Minimum Spanning Tree', 'DSU', 'Prim Algorithm', 'Uber']
    }
  ];

  let potdCount = 0;
  for (const b of batches) {
    for (let i = 0; i < potdProblems.length; i++) {
      const p = potdProblems[i];
      const pDate = new Date();
      pDate.setDate(pDate.getDate() - i);

      const exists = await prisma.dailyProblem.findFirst({
        where: {
          batchId: b.id,
          title: p.title
        }
      });

      if (!exists) {
        await prisma.dailyProblem.create({
          data: {
            batchId: b.id,
            postedById: primaryTrainer.id,
            date: pDate,
            title: p.title,
            description: p.description,
            company: p.company,
            difficulty: p.difficulty,
            platform: p.platform,
            link: p.link,
            tags: p.tags
          }
        });
        potdCount++;
      }
    }
  }

  console.log(`✅ Seeded ${potdCount} company POTD challenges across cohorts.`);
  console.log('🎉 Seeding completed successfully!');
  process.exit(0);
}

seedTrainerAndCalendar().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
