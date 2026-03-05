# new code for higher lower game
data = 1
import gamedata 
import game_art
import random

count = 0
print(game_art.logo)
for i in range(0, len(gamedata.data)):
    count += 1
    # print(gamedata.data[i]["name"] + " " + gamedata.data[i] ["country"])
# print("Total = ", count)

def get_random_index():
    # random_1 = random.randint(0, 49)
    return  random.randint(0,49)
        
# def ran2():
#     random_2 = random.randint(0, 49)
#     return  random_2
def compare_follower_a():
    print("Compare A: ", gamedata.data[idx1]["name"] + ", " + gamedata.data[idx1]["description"] + ", " + gamedata.data[idx1]["country"] + ", " + str(gamedata.data[idx1]["follower_count"]))

def compare_follower_b():
    print("Compare B: ", gamedata.data[idx2]["name"]  + ", " + gamedata.data[idx2]["description"] + ", " + gamedata.data[idx2]["country"] + ", " + str(gamedata.data[idx2]["follower_count"]))


# print(Compare_A, Compare_B)
# wrong_answer = False
user_input = " "
correct = 0
wrong_answer = 0
play = " "

while wrong_answer != 3 and play != "n":
    idx1 = get_random_index()
    compare_follower_a()
    # print("Compare A: ", gamedata.data[idx1]["name"] + ", " + gamedata.data[idx1]["description"] + ", " + gamedata.data[idx1]["country"] + ", " + str(gamedata.data[idx1]["follower_count"]))
    
    idx2 = get_random_index()
    compare_follower_b()
    # print("Compare B: ", gamedata.data[idx2]["name"]  + ", " + gamedata.data[idx2]["description"] + ", " + gamedata.data[idx2]["country"] + ", " + str(gamedata.data[idx2]["follower_count"]))
    print(" ")

    while idx1 == idx2:
        idx2 = get_random_index()

    follower_a = gamedata.data[idx1]["follower_count"]
    follower_b = gamedata.data[idx2]["follower_count"]

    user_input = input("Who has more followers? Type A or B: ").lower()
    # print("user imput =", user_input)
    # print("Compare_A =", follower_a)
    # print("Compare_B =", follower_b)
    

# guess = False

    if follower_a > follower_b:
        answer = follower_a
        selection ='a'
        
    else: 
        answer = follower_b
        selection ='b'
        compare_follower_b()

    # print("selection =", selection)
    # print(Compare_A, Compare_B,"answer = ", answer)
    if user_input == selection:
        print("You are right!")
        compare_follower_a()
        correct += 1
        
        if correct % 3 == 0:
           play =  input("Do you want to play again Y/N?").lower()
           print(" ")
           
    
    else:
        print("You are wrong!") 
        wrong_answer += 1
    
print("Wrongs = ", wrong_answer)

print("correct = ", correct)


