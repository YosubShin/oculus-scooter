int led = D0;
int INITIAL_THRESH = 40;
int INITIAL_DEVI = 5;
int INITIAL_MAX_TRANS = 12;
#define READING_N 200
#define IS_ON(x, mu) ((x) > (mu) + devi)
#define PREV_IDX(idx) (((idx) + READING_N - 1) % READING_N)
#define NEXT_IDX(idx) (((idx) + 1) % READING_N)

int thresh;
int devi;
int max_trans;

int readings[READING_N];
long reading_ts[READING_N];
int readings_sum;
double readings_mean;
char onoff[READING_N];
char mes[READING_N];
char trans[READING_N];
int num_trans;


int g_oldest_t = 0;
int g_newest_t = 0;
char g_onoff[READING_N + 1];
char g_mes[READING_N + 1];
char g_trans[READING_N + 1];
char g_total[READING_N * 3 + 3 + 100];
char g_times[100];




int cur_idx = 0;

void construct_str();

int set_thresh(String thresh);

int get_acc(String param);

int set_max_trans(String mt_);

void setup() {
    //Spark.variable("r_oldest_t", &r_oldest_t, INT);
    //Spark.variable("r_newest_t", &r_newest_t, INT);
    Spark.variable("num_trans", &num_trans, INT);
    Spark.variable("g_mes", &g_mes, STRING);
    Spark.variable("g_onoff", &g_onoff, STRING);
    Spark.variable("g_trans", &g_trans, STRING);
    Spark.variable("g_total", &g_total, STRING);

    Spark.function("set_thresh", set_thresh);
    Spark.function("set_devi", set_devi);
    Spark.function("set_max_trans", set_max_trans);
    Spark.function("get_acc", get_acc);

    pinMode(A0, INPUT);
    pinMode(led, OUTPUT);
    thresh = INITIAL_THRESH;
    devi = INITIAL_DEVI;
    max_trans = INITIAL_MAX_TRANS;
}

void loop() {
    digitalWrite(led, HIGH);
    
    g_oldest_t = (int)(reading_ts[cur_idx]);

    

    int oldest_v = readings[cur_idx];
    //int prev_v = readings[PREV_IDX(cur_idx)];
    int prev_onoff = onoff[PREV_IDX(cur_idx)] == '1';
    int cur_v = getLight();
    
    readings[cur_idx] = cur_v;
    reading_ts[cur_idx] = millis();
    readings_sum = readings_sum - oldest_v + cur_v;
    readings_mean = 1.0 * readings_sum / READING_N;

    mes[cur_idx] = '0' + (cur_v / 10);
    onoff[cur_idx] = '0' + IS_ON(cur_v, readings_mean);
    if (!prev_onoff && IS_ON(cur_v, readings_mean)) {
        trans[cur_idx] = '/';
    } else if (prev_onoff && !IS_ON(cur_v, readings_mean)) {
        trans[cur_idx] = '\\';
    } else {
        trans[cur_idx] = '_';
    }


    g_newest_t = (int)(reading_ts[cur_idx]);
    
    cur_idx = NEXT_IDX(cur_idx);
    
    num_trans = 0;
    for (int i = 0 ; i < READING_N ; i++) {
        if (trans[i] != '_') {
            num_trans++;
        }
    }
        
    construct_str();

    
}

void copywrap(char *dest, char *src, int from, int len) {    
    strncpy(dest, src + from, len - from);
    strncpy(dest + (len - from), src, from);
    dest[len] = '\0';
}

void construct_str() {
    strcpy(g_times, (String(g_oldest_t) + "/" + String(g_newest_t) + "/" + String(g_newest_t - g_oldest_t)).c_str());

    copywrap(g_onoff, onoff, cur_idx, READING_N);
    copywrap(g_mes, mes, cur_idx, READING_N);
    copywrap(g_trans, trans, cur_idx, READING_N);

    strcpy(g_total, g_mes);
    g_total[READING_N] = '/';
    strcpy(g_total + READING_N + 1, g_onoff);
    g_total[READING_N * 2 + 1] = '/';
    strcpy(g_total + 2 * READING_N + 2, g_trans);
    g_total[READING_N * 3 + 2] = '/';
//    g_total[READING_N * 3 + 2] = '\0';

    strcpy(g_total + 3 * READING_N + 3, String(num_trans).c_str());
}

int getLight() {
    // This converts the analog readings into percentage readings (from 0 through 4095 to 0 through 100)
    return map(analogRead(A0), 0, 4095, 0, 100);
}

int set_thresh(String thresh_) {
    thresh = atoi(thresh_.c_str());
    return 0;
}

int set_devi(String devi_) {
    devi = atoi(devi_.c_str());
    return 0;
}

int set_max_trans(String mt_) {
    max_trans = atoi(mt_.c_str());
    return 0;
}

int get_acc(String param) {
    int ms = atoi(param.c_str());
    int num_frames = (int) (1.0 * ms * 200 / 1000);
    if (num_frames > READING_N) {
        num_frames = READING_N;
    }
    int ret = 0;
    
    int c = cur_idx;
    int start = (c + READING_N - num_frames) % READING_N;
    for (int i = 0 ; i < num_frames ; i++) {
        int idx = (start + i) % READING_N;
        if (trans[i] != '_') {
            ret++;
        }
    
    }
    
    if (ret >= max_trans) {
        return 10;
    } else {
        return (int) (10.0 * ret / max_trans);
    }
}

